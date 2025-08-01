import { db, reportTemplates } from '@databuddy/db';
import { cron } from '@elysiajs/cron';
import { eq, inArray } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { nanoid } from 'nanoid';
import { logger } from '../lib/logger';
import { ReportScheduler } from '../services/report-scheduler';

let reportScheduler: ReportScheduler | null = null;
let isSyncRunning = false;

function getReportScheduler() {
	if (!reportScheduler) {
		reportScheduler = new ReportScheduler();
	}
	return reportScheduler;
}

export const reports = new Elysia({ prefix: '/v1' })
	.use(
		cron({
			name: 'report-scheduler-sync',
			pattern: '0 */5 * * * *',
			run() {
				if (isSyncRunning) {
					logger.warn(
						'Report scheduler sync already running, skipping this run.'
					);
					return;
				}
				isSyncRunning = true;
				logger.info('Running scheduled report sync...');
				getReportScheduler()
					.syncScheduledReports()
					.catch((error: unknown) => {
						logger.error('Failed to sync scheduled reports', { error });
					})
					.finally(() => {
						isSyncRunning = false;
						logger.info('Scheduled report sync finished.');
					});
			},
		})
	)
	.get('/reports/health', () => ({
		status: 'healthy',
		service: 'report-scheduler',
		timestamp: new Date().toISOString(),
	}))
	.post('/reports/execute/:templateId', async ({ params, set }) => {
		const { templateId } = params;
		logger.info(
			`Manual report execution requested for template: ${templateId}`
		);

		try {
			const template = await db.query.reportTemplates.findFirst({
				where: eq(reportTemplates.id, templateId),
				columns: {
					websiteId: true,
				},
			});

			if (!template?.websiteId) {
				set.status = 404;
				logger.error(`Template not found or has no websiteId: ${templateId}`);
				return {
					success: false,
					error: `Template not found or has no websiteId: ${templateId}`,
					timestamp: new Date().toISOString(),
				};
			}

			logger.info(
				`Queuing manual report execution for template: ${templateId}`
			);
			await getReportScheduler()
				.getQueue()
				.add(
					`manual-report-${templateId}-${nanoid(5)}`,
					{
						templateId,
						websiteId: template.websiteId,
					},
					{
						removeOnComplete: true,
						removeOnFail: true,
					}
				);
			logger.info(
				`Successfully queued manual report execution for template: ${templateId}`
			);

			return {
				success: true,
				message: `Report execution successfully queued for template: ${templateId}`,
				timestamp: new Date().toISOString(),
			};
		} catch (error: unknown) {
			logger.error('Manual report execution failed', {
				templateId,
				error: error instanceof Error ? error.message : String(error),
			});

			set.status = 500;
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			};
		}
	})
	.get('/reports/scheduled', async ({ set }) => {
		logger.info('Fetching scheduled reports...');
		try {
			const scheduledJobs = await getReportScheduler()
				.getQueue()
				.getRepeatableJobs();
			logger.info(`Found ${scheduledJobs.length} scheduled jobs in BullMQ.`);

			const templateIds = scheduledJobs
				.map((job) => job.name.split('report-')[1])
				.filter((id): id is string => !!id);

			if (templateIds.length === 0) {
				logger.info('No template IDs found in scheduled jobs.');
				return {
					success: true,
					data: [],
					timestamp: new Date().toISOString(),
				};
			}

			logger.info(
				`Fetching templates from database for IDs: ${templateIds.join(', ')}`
			);
			const templates = await db.query.reportTemplates.findMany({
				where: inArray(reportTemplates.id, templateIds),
			});
			logger.info(`Found ${templates.length} templates in database.`);

			const templatesById = new Map(templates.map((t) => [t.id, t]));

			const data = scheduledJobs.map((job) => {
				const templateId = job.name.split('report-')[1];
				const template = templateId ? templatesById.get(templateId) : undefined;
				return {
					id: templateId,
					name: template?.name,
					websiteId: template?.websiteId,
					scheduleType: template?.scheduleType,
					nextScheduledAt: job.next ? new Date(job.next).toISOString() : null,
					enabled: template?.enabled,
				};
			});

			logger.info(`Returning ${data.length} scheduled reports.`);
			return {
				success: true,
				data,
				timestamp: new Date().toISOString(),
			};
		} catch (error: unknown) {
			logger.error('Failed to get scheduled reports', { error });

			set.status = 500;
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			};
		}
	});
