import { z } from 'zod';

export const reportFilterSchema = z.object({
	field: z.string(),
	op: z.enum(['eq', 'ne', 'like', 'gt', 'lt', 'in', 'notIn']),
	value: z.union([
		z.string(),
		z.number(),
		z.array(z.union([z.string(), z.number()])),
	]),
});

export const reportTimeRangeSchema = z.object({
	start: z.string(),
	end: z.string(),
});

export const reportSectionSchema = z.object({
	id: z.string(),
	title: z.string(),
	queryType: z.string(),
	chartType: z.enum(['line', 'bar', 'pie', 'metric']).optional(),
	filters: z.array(reportFilterSchema).optional(),
	timeRange: reportTimeRangeSchema,
	includeComparison: z.boolean().default(false),
});

export const reportDataSchema = z.object({
	id: z.string(),
	success: z.boolean(),
	data: z.array(z.any()),
	meta: z.any().optional(),
	error: z.string().optional(),
});

export const reportJobDataSchema = z.object({
	templateId: z.string(),
	websiteId: z.string(),
});

export type ReportFilter = z.infer<typeof reportFilterSchema>;
export type ReportTimeRange = z.infer<typeof reportTimeRangeSchema>;
export type ReportSection = z.infer<typeof reportSectionSchema>;
export type ReportData = z.infer<typeof reportDataSchema>;
export type ReportJobData = z.infer<typeof reportJobDataSchema>;
