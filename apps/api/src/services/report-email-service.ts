import type { InferSelectModel, reportTemplates } from '@databuddy/db';
import { ReportEmail } from '@databuddy/email';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { logger } from '../lib/logger';

interface ReportData {
	id: string;
	success: boolean;
	data: unknown[];
	meta?: unknown;
	error?: string;
}

interface EmailOptions {
	comparisonData?: ReportData[] | null;
	insights?: string[];
}

interface EmailResult {
	recipients: string[];
	subject: string;
	totalAttempted: number;
	successfulSends: number;
	failedSends: number;
}

type ReportTemplate = InferSelectModel<typeof reportTemplates> & {
	websiteName?: string | null;
};

export async function sendReportEmail(
	template: ReportTemplate,
	reportData: ReportData[],
	options?: EmailOptions
): Promise<EmailResult> {
	try {
		const recipients = Array.isArray(template.recipients)
			? template.recipients
					.map((r: unknown) => {
						if (typeof r === 'string') {
							return r;
						}
						if (typeof r === 'object' && r && 'email' in r) {
							return (r as { email: string }).email;
						}
						return null;
					})
					.filter((email): email is string => Boolean(email))
			: [];

		if (recipients.length === 0) {
			throw new Error('No valid recipients found for report');
		}

		const subject = `${template.name} - ${template.websiteName || 'Analytics Report'}`;

		const emailHtml = await render(
			ReportEmail({
				reportName: template.name,
				websiteName: template.websiteName || undefined,
				reportData,
				executedAt: new Date().toISOString(),
				dashboardUrl: template.websiteId
					? `${process.env.DASHBOARD_URL}/websites/${template.websiteId}/reports`
					: undefined,
			})
		);

		logger.info(`Rendered report email for template: ${template.id}`, {
			reportName: template.name,
			dataCount: reportData.length,
			successfulQueries: reportData.filter((r) => r.success).length,
			failedQueries: reportData.filter((r) => !r.success).length,
			recipientCount: recipients.length,
			hasComparison: !!options?.comparisonData,
			insightCount: options?.insights?.length || 0,
		});

		if (!process.env.RESEND_API_KEY) {
			logger.error('RESEND_API_KEY is not set. Cannot send emails.');
			throw new Error(
				'Email service is not configured: RESEND_API_KEY is missing'
			);
		}

		logger.info('RESEND_API_KEY is present. Proceeding to send emails.');
		const resend = new Resend(process.env.RESEND_API_KEY);

		const emailPromises = recipients.map(async (recipient) => {
			try {
				const result = await resend.emails.send({
					from: 'reports@databuddy.cc',
					to: recipient,
					subject,
					html: emailHtml,
				});

				logger.info(`Successfully sent report email to ${recipient}`, {
					templateId: template.id,
					recipient,
					emailId: result.data?.id,
				});

				return { recipient, success: true, emailId: result.data?.id };
			} catch (error) {
				logger.error(`Failed to send report email to ${recipient}`, {
					templateId: template.id,
					recipient,
					error: error instanceof Error ? error.message : String(error),
				});
				return { recipient, success: false, error };
			}
		});

		const emailResults = await Promise.allSettled(emailPromises);
		const allResults: Array<{
			recipient: string;
			success: boolean;
			emailId?: string;
			error?: unknown;
		}> = [];

		for (const result of emailResults) {
			if (result.status === 'fulfilled') {
				allResults.push(result.value);
			} else {
				allResults.push({
					recipient: 'unknown',
					success: false,
					error: result.reason,
				});
			}
		}

		const successfulSends = allResults.filter((result) => result.success);
		const failedSends = allResults.filter((result) => !result.success);

		logger.info(
			`Report email delivery completed for template: ${template.id}`,
			{
				templateId: template.id,
				totalRecipients: recipients.length,
				successfulSends: successfulSends.length,
				failedSends: failedSends.length,
				successfulRecipients: successfulSends.map((s) => s.recipient),
				failedRecipients: failedSends.map((f) => f.recipient),
			}
		);

		if (successfulSends.length === 0 && recipients.length > 0) {
			throw new Error(
				`Failed to send report email to all ${recipients.length} recipients`
			);
		}

		return {
			recipients: successfulSends.map((s) => s.recipient),
			subject,
			totalAttempted: recipients.length,
			successfulSends: successfulSends.length,
			failedSends: failedSends.length,
		};
	} catch (error) {
		logger.error(`Failed to send report email for template: ${template.id}`, {
			error,
		});
		throw error;
	}
}
