'use client';

import { useArtifact } from '@ai-sdk-tools/artifacts/client';
import { getDataAnalysisTool } from '@databuddy/ai/tools/get-data-analysis'; // your tool id stays the same path-wise
import { DataAnalysisChart } from '@/components/charts/data-analysis-chart';
import {
	BaseCanvas,
	CanvasChart,
	CanvasGrid,
	CanvasHeader,
	CanvasSection,
} from './base';
import { CanvasContent } from './base/canvas-content';

type MetricItem = {
	id: string;
	title: string;
	value: string;
	subtitle?: string;
};

function formatMs(ms?: number) {
	if (!ms && ms !== 0) return '—';
	if (ms < 1000) return `${ms} ms`;
	const s = (ms / 1000).toFixed(2);
	return `${s}s`;
}

export function DataAnalysisCanvas() {
	// Pulls the latest artifact snapshot for this tool
	const { data, status } = useArtifact(getDataAnalysisTool);

	const isLoading = status === 'loading';
	const stage = data?.stage;

	const metrics: MetricItem[] = [
		{
			id: 'rows',
			title: 'Rows Returned',
			value: data?.metrics ? `${data.metrics.rowCount}` : isLoading ? 'Loading...' : '0',
			subtitle: data?.schemaPreview
				? `${Object.keys(data.schemaPreview.types || {}).length} columns`
				: undefined,
		},
		{
			id: 'time',
			title: 'Execution Time',
			value: data?.metrics ? formatMs(data.metrics.executionTimeMs) : isLoading ? 'Loading...' : '—',
			subtitle: data?.sqlPreview ? 'Read-only SQL' : undefined,
		},
	];

	const showChart =
		stage &&
		['chart_planning', 'chart_ready', 'metrics_ready', 'analysis_ready'].includes(stage);

	const showSummarySkeleton = !stage || stage !== 'analysis_ready';

	return (
		<BaseCanvas>
			<CanvasHeader isLoading={isLoading} title="Analysis" subtitle={data?.sqlPreview ? 'Result of a validated read-only SQL query' : undefined} />

			<CanvasContent>
				<div className="space-y-8">
					{/* SQL preview and schema snapshot */}
					{data?.sqlPreview ? (
						<CanvasSection title="Query">
							<pre className="whitespace-pre-wrap rounded-md bg-neutral-50 p-3 text-[11px] leading-5 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
								{data.sqlPreview}
							</pre>
						</CanvasSection>
					) : null}

					{data?.schemaPreview ? (
						<CanvasSection title="Schema">
							<div className="grid grid-cols-2 gap-3 text-[12px] md:grid-cols-3">
								{data.schemaPreview.columns.map((c) => (
									<div
										key={c}
										className="rounded border border-neutral-200 p-2 dark:border-neutral-800"
									>
										<div className="text-neutral-500 dark:text-neutral-400">{c}</div>
										<div className="text-neutral-900 dark:text-neutral-100">
											{data.schemaPreview?.types?.[c] ?? 'unknown'}
										</div>
									</div>
								))}
							</div>
						</CanvasSection>
					) : null}

					{/* Chart */}
					{showChart && (
						<CanvasChart
							height="24rem"
							isLoading={stage === 'chart_planning'}
							legend={undefined}
							title={data?.chart?.spec?.title ?? 'Visualization'}
						>
							<DataAnalysisChart
								spec={data?.chart?.spec ?? null}
								rows={data?.tablePreview ?? []}
								height={360}
							/>
						</CanvasChart>
					)}

					{/* Metrics */}
					<CanvasGrid
						isLoading={stage === 'loading' || stage === 'chart_planning' || stage === 'query_ready'}
						items={metrics}
						layout="2/2"
					/>

					{/* Summary */}
					<CanvasSection isLoading={showSummarySkeleton} title="Summary">
						<div className="space-y-3">
							{data?.analysis?.summary ? (
								<p className="text-[13px] leading-6">{data.analysis.summary}</p>
							) : null}

							{data?.analysis?.recommendations?.length ? (
								<ul className="list-disc space-y-1 pl-5 text-[13px]">
									{data.analysis.recommendations.map((r, i) => (
										<li key={i}>{r}</li>
									))}
								</ul>
							) : null}
						</div>
					</CanvasSection>
				</div>
			</CanvasContent>
		</BaseCanvas>
	);
}
