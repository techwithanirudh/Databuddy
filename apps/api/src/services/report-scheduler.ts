import type { InferSelectModel } from '@databuddy/db';
import { db, reportExecutions, reportTemplates } from '@databuddy/db';
import { getBullMqRedis } from '@databuddy/redis';
import { type Job, Queue, Worker } from 'bullmq';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { and, eq, gte, isNotNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { logger } from '../lib/logger';
import { executeDynamicQuery } from '../routes/query';
import type { DynamicQueryRequestType } from '../schemas';
import type {
	ReportData,
	ReportJobData,
	ReportSection,
	ReportTimeRange,
} from '../schemas/report-schemas';
import { sendReportEmail } from './report-email-service';

dayjs.extend(utc);

const REPORT_QUEUE_NAME = 'report-execution';
const SCHEDULER_SYNC_LOG_PREFIX = 'SCHEDULER_SYNC';
const WORKER_LOG_PREFIX = 'WORKER';
const SCHEDULER_LOG_PREFIX = 'SCHEDULER';

type ReportTemplate = InferSelectModel<typeof reportTemplates> & {
	websiteName?: string | null;
};

export class ReportScheduler {
	private reportQueue: Queue;
	private reportWorker: Worker;

	constructor() {
		logger.info('Initializing ReportScheduler...');
		this.reportQueue = new Queue(REPORT_QUEUE_NAME, {
			connection: getBullMqRedis(),
		});

		this.reportWorker = new Worker(
			REPORT_QUEUE_NAME,
			async (job: Job<ReportJobData>) => {
				await this.processReportJob(job);
			},
			{
				connection: getBullMqRedis(),
				concurrency: 5,
				removeOnComplete: { count: 100 },
				removeOnFail: { count: 50 },
			}
		);

		this.reportWorker.on('completed', (job) => {
			logger.info(
				`${WORKER_LOG_PREFIX}: Job ${job.id} completed successfully.`
			);
		});

		this.reportWorker.on('failed', (job, err) => {
			logger.error(`${WORKER_LOG_PREFIX}: Job ${job?.id} failed.`, {
				error: err,
			});
		});
		logger.info('ReportScheduler initialized.');
	}

	getQueue(): Queue {
		return this.reportQueue;
	}

	async scheduleReport(template: ReportTemplate): Promise<void> {
		if (!(template.scheduleType && template.scheduleTime)) {
			logger.warn(
				`${SCHEDULER_LOG_PREFIX}: Attempted to schedule a report without schedule info: ${template.id}`
			);
			return;
		}

		const repeatOpts = {
			pattern: this.convertScheduleToCron(template),
			tz: template.timezone ?? 'UTC',
		};

		logger.info(
			`${SCHEDULER_LOG_PREFIX}: Scheduling report ${template.id} with options:`,
			repeatOpts
		);

		await this.reportQueue.add(
			`report-${template.id}`,
			{
				templateId: template.id,
				websiteId: template.websiteId ?? 'unknown',
			},
			{
				jobId: template.id,
				removeOnComplete: true,
				removeOnFail: true,
				repeat: repeatOpts,
			}
		);
	}

	async unscheduleReport(templateId: string): Promise<void> {
		const repeatableJobs = await this.reportQueue.getRepeatableJobs();
		const job = repeatableJobs.find((j) => j.id === templateId);

		if (job) {
			await this.reportQueue.removeRepeatableByKey(job.key);
			logger.info(
				`${SCHEDULER_LOG_PREFIX}: Unscheduled report ${templateId} successfully.`
			);
		} else {
			logger.warn(
				`${SCHEDULER_LOG_PREFIX}: Could not find report ${templateId} to unschedule.`
			);
		}
	}

	private convertScheduleToCron(template: ReportTemplate): string {
		const [hour, minute] = (template.scheduleTime ?? '09:00:00')
			.split(':')
			.map(Number);
		const dayOfMonth = template.scheduleDay ?? 1;
		let dayOfWeek = template.scheduleDay;

		switch (template.scheduleType) {
			case 'daily':
				return `${minute} ${hour} * * *`;
			case 'weekly':
				if (dayOfWeek === null || dayOfWeek === undefined) {
					logger.warn(
						`scheduleDay is not set for weekly report template ${template.id}. Defaulting to Monday (1).`
					);
					dayOfWeek = 1;
				}
				return `${minute} ${hour} * * ${dayOfWeek}`;
			case 'monthly':
				return `${minute} ${hour} ${dayOfMonth} * *`;
			default:
				throw new Error(`Unsupported schedule type: ${template.scheduleType}`);
		}
	}

	private async processReportJob(job: Job<ReportJobData>): Promise<void> {
		const { templateId, websiteId } = job.data;
		const startTime = Date.now();
		logger.info(
			`${WORKER_LOG_PREFIX}: [${templateId}] Starting report processing...`
		);

		try {
			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Fetching template from database...`
			);
			const template = await db.transaction(async (tx) => {
				const [lockedTemplate] = await tx
					.select()
					.from(reportTemplates)
					.where(eq(reportTemplates.id, templateId))
					.for('update')
					.limit(1);

				if (!lockedTemplate) {
					throw new Error(`Report template not found: ${templateId}`);
				}
				return lockedTemplate;
			});
			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Template fetched successfully.`
			);

			if (!template.enabled) {
				logger.warn(
					`${WORKER_LOG_PREFIX}: [${templateId}] Skipping disabled report.`
				);
				return;
			}

			if (await this.checkRecentExecution(templateId)) {
				logger.warn(
					`${WORKER_LOG_PREFIX}: [${templateId}] Report was already executed recently, skipping.`
				);
				return;
			}

			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Building queries from sections...`
			);
			const queries = this.buildQueriesFromSections(
				template.sections as ReportSection[]
			);
			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Built ${queries.length} queries.`
			);

			logger.info(`${WORKER_LOG_PREFIX}: [${templateId}] Executing queries...`);
			const data = await this.executeQueries(queries, websiteId);
			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Queries executed successfully.`
			);

			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Fetching comparison data...`
			);
			const comparisonData = await this.getComparisonData(template);
			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Comparison data fetched.`
			);

			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Generating insights...`
			);
			const insights = this.generateBasicInsights(data, comparisonData);
			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Generated ${insights.length} insights.`
			);

			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Sending report email...`
			);
			const emailResult = await sendReportEmail(template, data, {
				comparisonData,
				insights,
			});
			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Report email processed.`
			);

			const generationTime = Date.now() - startTime;
			await this.recordSuccessfulExecution(
				template,
				emailResult,
				generationTime
			);
			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Report execution completed successfully.`,
				{
					generationTimeMs: generationTime,
					recipientCount: emailResult.recipients?.length ?? 0,
				}
			);
		} catch (error) {
			const generationTime = Date.now() - startTime;
			logger.error(
				`${WORKER_LOG_PREFIX}: [${templateId}] Report execution failed.`,
				{ error, generationTimeMs: generationTime }
			);
			await this.recordFailedExecution(
				templateId,
				websiteId,
				error,
				generationTime
			);
			throw error;
		}
	}

	private async checkRecentExecution(templateId: string): Promise<boolean> {
		logger.info(
			`${WORKER_LOG_PREFIX}: [${templateId}] Checking for recent executions...`
		);
		const [recentExecution] = await db
			.select()
			.from(reportExecutions)
			.where(
				and(
					eq(reportExecutions.templateId, templateId),
					eq(reportExecutions.status, 'sent'),
					gte(
						reportExecutions.executedAt,
						dayjs.utc().subtract(5, 'minute').toISOString()
					)
				)
			)
			.orderBy(reportExecutions.executedAt)
			.limit(1);

		if (recentExecution) {
			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] Found recent execution.`
			);
		} else {
			logger.info(
				`${WORKER_LOG_PREFIX}: [${templateId}] No recent execution found.`
			);
		}
		return !!recentExecution;
	}

	private async recordSuccessfulExecution(
		template: ReportTemplate,
		emailResult: { recipients: string[]; subject: string },
		generationTime: number
	): Promise<void> {
		logger.info(
			`${WORKER_LOG_PREFIX}: [${template.id}] Recording successful execution...`
		);
		await db.transaction(async (tx) => {
			await tx.insert(reportExecutions).values({
				id: nanoid(),
				templateId: template.id,
				websiteId: template.websiteId ?? 'unknown',
				status: 'sent',
				generationTimeMs: generationTime,
				recipientsSent: JSON.stringify(emailResult.recipients),
				emailSubject: emailResult.subject,
				executedAt: dayjs.utc().toISOString(),
				createdAt: dayjs.utc().toISOString(),
			});

			await tx
				.update(reportTemplates)
				.set({
					lastSentAt: dayjs.utc().toISOString(),
					updatedAt: dayjs.utc().toISOString(),
				})
				.where(eq(reportTemplates.id, template.id));
		});
		logger.info(
			`${WORKER_LOG_PREFIX}: [${template.id}] Successful execution recorded.`
		);
	}

	private async recordFailedExecution(
		templateId: string,
		websiteId: string,
		error: unknown,
		generationTime: number
	): Promise<void> {
		logger.error(
			`${WORKER_LOG_PREFIX}: [${templateId}] Recording failed execution...`
		);
		await db.insert(reportExecutions).values({
			id: nanoid(),
			templateId,
			websiteId,
			status: 'failed',
			generationTimeMs: generationTime,
			errorMessage: error instanceof Error ? error.message : 'Unknown error',
			executedAt: dayjs.utc().toISOString(),
			createdAt: dayjs.utc().toISOString(),
		});
		logger.error(
			`${WORKER_LOG_PREFIX}: [${templateId}] Failed execution recorded.`
		);
	}

	private buildQueriesFromSections(
		sections: ReportSection[]
	): DynamicQueryRequestType[] {
		return sections.map((section) => ({
			id: nanoid(),
			parameters: [section.queryType],
			filters: section.filters ?? [],
			startDate: section.timeRange.start,
			endDate: section.timeRange.end,
			limit: 100,
			granularity: this.getGranularityFromTimeRange(section.timeRange),
		}));
	}

	private getGranularityFromTimeRange(
		timeRange: ReportTimeRange
	): 'hour' | 'day' {
		const start = dayjs.utc(timeRange.start);
		const end = dayjs.utc(timeRange.end);
		const diffDays = end.diff(start, 'day');

		if (diffDays <= 1) {
			return 'hour';
		}
		return 'day';
	}

	private executeQueries(
		queries: DynamicQueryRequestType[],
		websiteId: string
	): Promise<ReportData[]> {
		return Promise.all(
			queries.map(async (query) => {
				try {
					const result = await executeDynamicQuery(query, {
						website_id: websiteId,
						start_date: query.startDate,
						end_date: query.endDate,
						timezone: 'UTC',
					});

					return {
						id: query.id ?? nanoid(),
						success: true,
						data: result.data ?? [],
						meta: result.meta,
					};
				} catch (error) {
					logger.error(`Query execution failed for query: ${query.id}`, {
						error,
					});
					return {
						id: query.id ?? nanoid(),
						success: false,
						error: error instanceof Error ? error.message : 'Query failed',
						data: [],
					};
				}
			})
		);
	}

	private async getComparisonData(
		template: ReportTemplate
	): Promise<ReportData[] | null> {
		const sections = template.sections as ReportSection[];
		const sectionsWithComparison = sections.filter(
			(section) => section.includeComparison
		);

		if (sectionsWithComparison.length === 0) {
			return null;
		}

		const comparisonQueries: DynamicQueryRequestType[] =
			sectionsWithComparison.map((section) => {
				const { timeRange } = section;
				const start = dayjs.utc(timeRange.start);
				const end = dayjs.utc(timeRange.end);
				const diffDays = end.diff(start, 'day');

				const comparisonStart = start.subtract(diffDays, 'day');
				const comparisonEnd = start;
				const comparisonTimeRange = {
					start: comparisonStart.toISOString(),
					end: comparisonEnd.toISOString(),
				};

				return {
					id: `${section.id}_comparison`,
					parameters: [section.queryType],
					filters: section.filters ?? [],
					startDate: comparisonTimeRange.start,
					endDate: comparisonTimeRange.end,
					limit: 100,
					granularity: this.getGranularityFromTimeRange(comparisonTimeRange),
				};
			});

		if (!template.websiteId) {
			return null;
		}

		try {
			return await this.executeQueries(comparisonQueries, template.websiteId);
		} catch (error) {
			logger.error('Failed to fetch comparison data', { error });
			return null;
		}
	}

	private generateBasicInsights(
		data: ReportData[],
		comparisonData?: ReportData[] | null
	): string[] {
		const insights: string[] = [];

		try {
			this.addActivityInsights(data, insights);
			this.addComparisonInsights(data, comparisonData, insights);
			this.addPerformanceInsights(data, insights);
		} catch (error) {
			logger.error('Error generating insights', { error });
			insights.push('Unable to generate insights for this report');
		}

		return insights;
	}

	private addActivityInsights(data: ReportData[], insights: string[]): void {
		if (data.length === 0) {
			return;
		}

		let totalMetrics = 0;
		for (const result of data) {
			if (result.success && result.data.length > 0) {
				const firstDataPoint = result.data[0] as {
					count?: number;
					value?: number;
				};
				if (firstDataPoint.count || firstDataPoint.value) {
					totalMetrics += Number(
						firstDataPoint.count ?? firstDataPoint.value ?? 0
					);
				}
			}
		}

		if (totalMetrics > 0) {
			insights.push(
				`Total activity recorded: ${totalMetrics.toLocaleString()} events`
			);
		}
	}

	private addComparisonInsights(
		data: ReportData[],
		comparisonData: ReportData[] | null | undefined,
		insights: string[]
	): void {
		if (!comparisonData?.length) {
			return;
		}

		const currentTotal = this.calculateTotalFromData(data);
		const previousTotal = this.calculateTotalFromData(comparisonData);

		if (currentTotal > 0 && previousTotal > 0) {
			const change = ((currentTotal - previousTotal) / previousTotal) * 100;
			const direction = change > 0 ? 'increased' : 'decreased';
			const changeText = Math.abs(change).toFixed(1);

			insights.push(
				`Activity ${direction} by ${changeText}% compared to the previous period`
			);
		}
	}

	private addPerformanceInsights(data: ReportData[], insights: string[]): void {
		const errorResults = data.filter((result) => !result.success);
		if (errorResults.length > 0) {
			insights.push(
				`${errorResults.length} queries had issues during report generation`
			);
		}
	}

	private calculateTotalFromData(data: ReportData[]): number {
		let totalValue = 0;
		for (const result of data) {
			if (result.success && result.data.length > 0) {
				const resultTotal = result.data.reduce((sum: number, item: unknown) => {
					const dataItem = item as { count?: number; value?: number };
					return sum + Number(dataItem.count ?? dataItem.value ?? 0);
				}, 0);
				totalValue += resultTotal;
			}
		}
		return totalValue;
	}

	async close(): Promise<void> {
		logger.info('Closing ReportScheduler...');
		await this.reportWorker.close();
		await this.reportQueue.close();
		logger.info('ReportScheduler closed.');
	}

	async syncScheduledReports(): Promise<void> {
		logger.info(
			`${SCHEDULER_SYNC_LOG_PREFIX}: Starting sync of database schedules to BullMQ...`
		);

		const repeatableJobs = await this.reportQueue.getRepeatableJobs();
		if (repeatableJobs.length > 0) {
			logger.info(
				`${SCHEDULER_SYNC_LOG_PREFIX}: Clearing all ${repeatableJobs.length} existing repeatable jobs...`
			);
			await Promise.all(
				repeatableJobs.map((job) =>
					this.reportQueue.removeRepeatableByKey(job.key)
				)
			);
			logger.info(
				`${SCHEDULER_SYNC_LOG_PREFIX}: All existing repeatable jobs cleared.`
			);
		}

		const templates = await db
			.select()
			.from(reportTemplates)
			.where(
				and(
					eq(reportTemplates.enabled, true),
					isNotNull(reportTemplates.scheduleType)
				)
			);
		logger.info(
			`${SCHEDULER_SYNC_LOG_PREFIX}: Found ${templates.length} active schedules in database.`
		);

		if (templates.length > 0) {
			logger.info(
				`${SCHEDULER_SYNC_LOG_PREFIX}: Re-scheduling all active templates...`
			);
			await Promise.all(
				templates.map((template) => this.scheduleReport(template))
			);
		}

		logger.info(
			`${SCHEDULER_SYNC_LOG_PREFIX}: Sync complete. ${templates.length} schedules are now active.`
		);
	}
}

export const reportScheduler = new ReportScheduler();
