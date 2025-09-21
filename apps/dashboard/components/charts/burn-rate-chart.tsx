'use client';

import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
} from 'recharts';

interface BurnRateData {
	month: string;
	amount: number;
	average: number;
	currentBurn: number;
	averageBurn: number;
}

interface BurnRateChartProps {
	data: BurnRateData[];
	height?: number;
	chartReadyToAnimate?: boolean;
	showLegend?: boolean;
	currency?: string;
	locale?: string;
}

// Custom tooltip component
const CustomTooltip = ({
	active,
	payload,
	label,
	currency = 'USD',
	locale,
}: any) => {
	if (active && Array.isArray(payload) && payload.length > 0) {
		const _current = payload[0]?.value;
		const _average = payload[1]?.value;

		return (
			<div className="border border-[#e6e6e6] bg-white p-2 font-hedvig-sans text-[10px] text-black shadow-sm dark:border-[#1d1d1d] dark:bg-[#0c0c0c] dark:text-white">
				<p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
			</div>
		);
	}
	return null;
};

export function BurnRateChart({
	data,
	height = 320,
	chartReadyToAnimate = false,
	currency = 'USD',
	locale,
}: BurnRateChartProps) {
	return (
		<div className="w-full">
			{/* Chart */}
			<div style={{ height }}>
				<ResponsiveContainer height="100%" width="100%">
					<ComposedChart
						data={data}
						margin={{ top: 0, right: 6, left: -10, bottom: 0 }}
					>
						<defs>
							<pattern
								height="8"
								id="burnRatePattern"
								patternUnits="userSpaceOnUse"
								width="8"
								x="0"
								y="0"
							>
								<rect
									className="dark:fill-[#0c0c0c]"
									fill="white"
									height="8"
									width="8"
								/>
								<path
									className="dark:stroke-[#666666]"
									d="M0,0 L8,8 M-2,6 L6,16 M-4,4 L4,12"
									opacity="0.6"
									stroke="#707070"
									strokeWidth="0.8"
								/>
							</pattern>
							<linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
								<stop
									className="dark:[stop-color:#666666]"
									offset="0%"
									stopColor="#707070"
								/>
								<stop
									className="dark:[stop-color:#ffffff]"
									offset="100%"
									stopColor="#000000"
								/>
							</linearGradient>
						</defs>
						<CartesianGrid
							className="dark:stroke-[#1d1d1d]"
							stroke="#e6e6e6"
							strokeDasharray="3 3"
						/>
						<XAxis
							axisLine={false}
							dataKey="month"
							tick={{
								fill: '#707070',
								fontSize: 10,
								fontFamily: 'Hedvig Letters Sans',
								className: 'dark:fill-[#666666]',
							}}
							tickLine={false}
						/>
						<Tooltip
							content={<CustomTooltip currency={currency} locale={locale} />}
							wrapperStyle={{ zIndex: 9999 }}
						/>
						<Area
							activeDot={{
								r: 5,
								fill: '#000000',
								stroke: '#000000',
								strokeWidth: 2,
								className: 'dark:fill-white dark:stroke-white',
							}}
							dataKey="amount"
							dot={{
								fill: '#000000',
								strokeWidth: 0,
								r: 3,
								className: 'dark:fill-white',
							}}
							fill="url(#burnRatePattern)"
							isAnimationActive={false}
							stroke="url(#lineGradient)"
							strokeWidth={2}
							type="monotone"
						/>
						<Line
							className="dark:stroke-[#666666]"
							dataKey="average"
							dot={false}
							isAnimationActive={false}
							stroke="#707070"
							strokeDasharray="5 5"
							strokeWidth={1}
							style={{
								opacity: chartReadyToAnimate ? 1 : 0,
								transition: 'opacity 0.3s ease-out',
							}}
							type="monotone"
						/>
					</ComposedChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
