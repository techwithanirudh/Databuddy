import { artifact } from '@ai-sdk-tools/artifacts';
import { z } from 'zod';

const chartConfigSchema = z.record(
	z.string(),
	z.object({
		label: z.string().optional(),
		color: z.string().optional(),
	})
);

const commonChartSchema = z.object({
	title: z.string(),
	progress: z.number().min(0).max(1).default(1),
	config: chartConfigSchema.optional(),
	data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
	xKey: z.string().optional(),
	series: z.array(z.string()).optional(),
	nameKey: z.string().optional(),
	valueKey: z.string().optional(),
	options: z
		.object({
			tooltip: z
				.object({
					labelKey: z.string().optional(),
					nameKey: z.string().optional(),
				})
				.optional(),
			legend: z
				.object({
					nameKey: z.string().optional(),
				})
				.optional(),
		})
		.optional(),
});

export const BarChartArtifact = artifact('bar-chart', commonChartSchema);

export const LineChartArtifact = artifact('line-chart', commonChartSchema);

export const AreaChartArtifact = artifact('area-chart', commonChartSchema);

export const PieChartArtifact = artifact('pie-chart', commonChartSchema);

export const RadarChartArtifact = artifact('radar-chart', commonChartSchema);

export const RadialChartArtifact = artifact('radial-chart', commonChartSchema);
