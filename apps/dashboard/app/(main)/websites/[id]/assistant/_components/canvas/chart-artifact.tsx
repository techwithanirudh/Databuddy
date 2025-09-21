'use client';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, RadialBar, RadialBarChart, XAxis } from 'recharts';

type ChartPayload = {
    title: string;
    data: Array<Record<string, string | number>>;
    config?: Record<string, { label?: string; color?: string }>;
    xKey?: string;
    series?: string[];
    nameKey?: string;
    valueKey?: string;
};

export function ChartArtifactRenderer({ kind, payload }: { kind: 'bar' | 'line' | 'area' | 'pie' | 'radar' | 'radial'; payload: ChartPayload }) {
    const { title, data, config = {}, xKey, series = [], nameKey, valueKey } = payload;

    const chartConfig = Object.fromEntries(Object.entries(config).map(([k, v]) => [k, { label: v.label, color: v.color }]));

    const xKeyOrFirst = xKey || (data.length ? Object.keys(data[0])[0] : 'name');
    const resolvedSeries = series.length ? series : (data.length ? Object.keys(data[0]).filter((k) => k !== xKeyOrFirst) : []);

    return (
        <div className="w-full">
            <div className="mb-2 text-sm font-medium text-muted-foreground">{title}</div>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                {kind === 'bar' && (
                    <BarChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey={xKeyOrFirst} tickLine={false} tickMargin={10} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        {resolvedSeries.map((key) => (
                            <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={4} />
                        ))}
                    </BarChart>
                )}
                {kind === 'line' && (
                    <LineChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey={xKeyOrFirst} tickLine={false} tickMargin={10} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        {resolvedSeries.map((key) => (
                            <Line key={key} type="monotone" dataKey={key} stroke={`var(--color-${key})`} dot={false} strokeWidth={2} />
                        ))}
                    </LineChart>
                )}
                {kind === 'area' && (
                    <AreaChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey={xKeyOrFirst} tickLine={false} tickMargin={10} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        {resolvedSeries.map((key) => (
                            <Area key={key} type="monotone" dataKey={key} fill={`var(--color-${key})`} stroke={`var(--color-${key})`} />
                        ))}
                    </AreaChart>
                )}
                {kind === 'pie' && (
                    <PieChart accessibilityLayer>
                        <ChartTooltip content={<ChartTooltipContent nameKey={nameKey} />} />
                        <ChartLegend content={<ChartLegendContent nameKey={nameKey} />} />
                        <Pie data={data} dataKey={valueKey || 'value'} nameKey={nameKey || 'name'} />
                    </PieChart>
                )}
                {kind === 'radar' && (
                    <RadarChart accessibilityLayer data={data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey={xKeyOrFirst} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Radar dataKey={resolvedSeries[0]} stroke={`var(--color-${resolvedSeries[0]})`} fill={`var(--color-${resolvedSeries[0]})`} fillOpacity={0.6} />
                    </RadarChart>
                )}
                {kind === 'radial' && (
                    <RadialBarChart accessibilityLayer data={data} innerRadius="20%" outerRadius="90%">
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <RadialBar background dataKey={valueKey || resolvedSeries[0]} />
                    </RadialBarChart>
                )}
            </ChartContainer>
        </div>
    );
}


