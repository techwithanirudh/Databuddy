import { ChartLineIcon } from '@phosphor-icons/react';
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
	type ChartDataRow,
	METRICS,
	type MetricConfig,
} from './metrics-constants';
import { SkeletonChart } from './skeleton-chart';

const CustomTooltip = ({ active, payload, label }: any) => {
	if (!(active && payload?.length)) {
		return null;
	}

	return (
		<div className="min-w-[200px] rounded border border-border/50 bg-card p-4">
			<div className="mb-3 flex items-center gap-2 border-border/30 border-b pb-2">
				<div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
				<p className="font-semibold text-foreground text-sm">{label}</p>
			</div>
			<div className="space-y-2.5">
				{Object.entries(
					payload.reduce((groups: any, entry: any) => {
						const key = entry.dataKey
							.replace('_historical', '')
							.replace('_future', '');
						if (!groups[key] || entry.dataKey.includes('_future')) {
							groups[key] = entry;
						}
						return groups;
					}, {})
				).map(([key, entry]: [string, any]) => {
					const metric = METRICS.find((m) => m.key === key);
					if (!metric) {
						return null;
					}

					const value = metric.formatValue
						? metric.formatValue(entry.value, entry.payload)
						: entry.value.toLocaleString();

					return (
						<div className="flex items-center justify-between gap-3" key={key}>
							<div className="flex items-center gap-2.5">
								<div
									className="h-3 w-3 rounded-full"
									style={{ backgroundColor: entry.color }}
								/>
								<span className="text-muted-foreground text-xs">
									{metric.label}
								</span>
							</div>
							<span className="font-bold text-foreground text-sm">{value}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

interface MetricsChartProps {
	data: ChartDataRow[] | undefined;
	isLoading: boolean;
	height?: number;
	title?: string;
	description?: string;
	className?: string;
	hiddenMetrics?: Record<string, boolean>;
	onToggleMetric?: (metricKey: string) => void;
	metricsFilter?: (metric: MetricConfig) => boolean;
	showLegend?: boolean;
}

export function MetricsChart({
	data,
	isLoading,
	height = 550,
	title,
	description,
	className,
	hiddenMetrics = {},
	onToggleMetric,
	metricsFilter,
	showLegend = true,
}: MetricsChartProps) {
	const rawData = data || [];

	const metrics = metricsFilter
		? METRICS.filter(metricsFilter)
		: METRICS.filter((metric) =>
				[
					'pageviews',
					'visitors',
					'sessions',
					'bounce_rate',
					'avg_session_duration',
				].includes(metric.key)
			);

	const chartData = rawData.map((item, index) => {
		const isFutureOrCurrent = index === rawData.length - 1;
		const connectsToFuture = index === rawData.length - 2;

		const result = { ...item };
		for (const metric of metrics) {
			result[`${metric.key}_historical`] = isFutureOrCurrent
				? null
				: item[metric.key];
			if (isFutureOrCurrent || connectsToFuture) {
				result[`${metric.key}_future`] = item[metric.key];
			}
		}
		return result;
	});

	if (isLoading) {
		return <SkeletonChart className="w-full" height={height} title={title} />;
	}

	if (!chartData.length) {
		return (
			<Card
				className={cn(
					'w-full border-0 bg-gradient-to-br from-background to-muted/20',
					className
				)}
			>
				<CardHeader className="px-6 py-6">
					<CardTitle className="flex items-center gap-2 font-semibold text-lg">
						<ChartLineIcon className="h-5 w-5 text-primary" />
						{title}
					</CardTitle>
					{description && (
						<CardDescription className="text-sm">{description}</CardDescription>
					)}
				</CardHeader>
				<CardContent className="flex items-center justify-center p-8">
					<div className="py-12 text-center">
						<div className="relative">
							<ChartLineIcon
								className="mx-auto h-16 w-16 text-muted-foreground/20"
								strokeWidth={1.5}
							/>
							<div className="absolute inset-0 rounded-full bg-gradient-to-t from-primary/10 to-transparent blur-xl" />
						</div>
						<p className="mt-6 font-semibold text-foreground text-lg">
							No data available
						</p>
						<p className="mx-auto mt-2 max-w-sm text-muted-foreground text-sm">
							Your analytics data will appear here as visitors interact with
							your website
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={cn('w-full overflow-hidden rounded-none p-0', className)}>
			<CardContent className="p-0">
				<div
					className="relative"
					style={{ width: '100%', height: height + 20 }}
				>
					<ResponsiveContainer height="100%" width="100%">
						<ComposedChart
							data={chartData}
							margin={{
								top: 30,
								right: 30,
								left: 20,
								bottom: chartData.length > 5 ? 60 : 20,
							}}
						>
							<defs>
								{metrics.map((metric) => (
									<linearGradient
										id={`gradient-${metric.gradient}`}
										key={metric.key}
										x1="0"
										x2="0"
										y1="0"
										y2="1"
									>
										<stop
											offset="0%"
											stopColor={metric.color}
											stopOpacity={0.3}
										/>
										<stop
											offset="100%"
											stopColor={metric.color}
											stopOpacity={0.02}
										/>
									</linearGradient>
								))}
							</defs>
							<CartesianGrid
								stroke="var(--border)"
								strokeDasharray="2 4"
								strokeOpacity={0.3}
								vertical={false}
							/>
							<XAxis
								axisLine={false}
								dataKey="date"
								tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
								tickLine={false}
							/>
							<YAxis
								axisLine={false}
								tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
								tickLine={false}
								width={45}
							/>
							<Tooltip
								content={<CustomTooltip />}
								cursor={{ stroke: 'var(--primary)', strokeDasharray: '4 4' }}
							/>
							{showLegend && (
								<Legend
									align="center"
									formatter={(label) => {
										const metric = metrics.find((m) => m.label === label);
										const isHidden = metric && hiddenMetrics[metric.key];
										return (
											<span
												className={`cursor-pointer text-xs ${
													isHidden
														? 'text-muted-foreground/50 line-through'
														: 'text-muted-foreground hover:text-foreground'
												}`}
											>
												{label}
											</span>
										);
									}}
									onClick={(payload: any) => {
										const metric = metrics.find(
											(m) => m.label === payload.value
										);
										if (metric && onToggleMetric) {
											onToggleMetric(metric.key);
										}
									}}
									verticalAlign="bottom"
									wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
								/>
							)}
							{metrics.map((metric) => (
								<Area
									activeDot={{ r: 4, stroke: metric.color, strokeWidth: 2 }}
									dataKey={`${metric.key}_historical`}
									fill={`url(#gradient-${metric.gradient})`}
									hide={hiddenMetrics[metric.key]}
									key={metric.key}
									name={metric.label}
									stroke={metric.color}
									strokeWidth={2.5}
									type="monotone"
								/>
							))}
							{metrics.map((metric) => (
								<Area
									connectNulls={false}
									dataKey={`${metric.key}_future`}
									dot={false}
									fill={`url(#gradient-${metric.gradient})`}
									hide={hiddenMetrics[metric.key]}
									key={`future-${metric.key}`}
									legendType="none"
									stroke={metric.color}
									strokeDasharray="4 4"
									strokeOpacity={0.8}
									strokeWidth={2}
									type="monotone"
								/>
							))}
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
