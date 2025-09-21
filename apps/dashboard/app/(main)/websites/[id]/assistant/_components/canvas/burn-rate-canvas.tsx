'use client';

import { useArtifact } from '@ai-sdk-tools/artifacts/client';
import { analyzeBurnRateTool } from '@databuddy/ai/tools/burn-rate';
import { useSession } from '@databuddy/auth/client';
import { BurnRateChart } from '@/components/charts';
import {
	BaseCanvas,
	CanvasChart,
	CanvasGrid,
	CanvasHeader,
	CanvasSection,
} from './base';
import { CanvasContent } from './base/canvas-content';

export function BurnRateCanvas({ websiteId }: { websiteId: string }) {
	const { data, status } = useArtifact(analyzeBurnRateTool);
	const { data: session } = useSession();

	const isLoading = status === 'loading';
	const stage = data?.stage;

	// Use artifact data or fallback to empty/default values
	const burnRateData =
		data?.chart?.monthlyData?.map((item) => ({
			month: item.month,
			amount: item.currentBurn,
			average: item.averageBurn,
			currentBurn: item.currentBurn,
			averageBurn: item.averageBurn,
		})) || [];

	const burnRateMetrics = data?.metrics
		? [
				{
					id: 'current-burn',
					title: 'Current Monthly Burn',
					value: '10,000',
					subtitle: data.analysis?.burnRateChange
						? `${data.analysis.burnRateChange.percentage}% vs ${data.analysis.burnRateChange.period}`
						: stage === 'loading'
							? 'Loading...'
							: 'No change data',
				},
				{
					id: 'runway-remaining',
					title: 'Runway Remaining',
					value: `${data.metrics.runway || 0} months`,
					subtitle:
						data.metrics.runwayStatus ||
						(stage === 'loading' ? 'Loading...' : 'No data'),
				},
				{
					id: 'average-burn',
					title: 'Average Burn Rate',
					value: '10,000',
					subtitle: `Over last ${data.chart?.monthlyData?.length || 0} months`,
				},
				{
					id: 'highest-category',
					title: data.metrics.topCategory?.name || 'Top Category',
					value: `${data.metrics.topCategory?.percentage || 0}%`,
					subtitle: '1',
				},
			]
		: [];

	const showChart =
		stage &&
		['loading', 'chart_ready', 'metrics_ready', 'analysis_ready'].includes(
			stage
		);

	const showSummarySkeleton = !stage || stage !== 'analysis_ready';

	return (
		<BaseCanvas>
			<CanvasHeader isLoading={isLoading} title="Analysis" />

			<CanvasContent>
				<div className="space-y-8">
					{/* Show chart as soon as we have burn rate data */}
					{showChart && (
						<CanvasChart
							height="20rem"
							isLoading={stage === 'loading'}
							legend={{
								items: [
									{ label: 'Current', type: 'solid' },
									{ label: 'Average', type: 'pattern' },
								],
							}}
							title="Monthly Burn Rate"
						>
							<BurnRateChart
								chartReadyToAnimate={true}
								currency={data?.currency || 'USD'}
								data={burnRateData}
								height={320}
								locale={user?.locale ?? undefined}
								showLegend={false}
							/>
						</CanvasChart>
					)}

					{/* Always show metrics section */}
					<CanvasGrid
						isLoading={stage === 'loading' || stage === 'chart_ready'}
						items={burnRateMetrics}
						layout="2/2"
					/>

					{/* Always show summary section */}
					<CanvasSection isLoading={showSummarySkeleton} title="Summary">
						{data?.analysis?.summary}
					</CanvasSection>
				</div>
			</CanvasContent>
		</BaseCanvas>
	);
}
