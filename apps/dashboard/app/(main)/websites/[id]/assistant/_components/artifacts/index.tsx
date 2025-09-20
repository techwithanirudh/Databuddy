import React from 'react'
import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { BurnRateAnalysisPanel } from './burn-rate/analysis-panel';
import { ChartArtifactRenderer } from './chart-artifact';

export function Artifacts() {
  const { current } = useArtifacts();
  
  switch (current?.type) {
    case 'burn-rate':
      return <BurnRateAnalysisPanel />;
    case 'bar-chart':
      return <ChartArtifactRenderer kind="bar" payload={current.payload} />;
    case 'line-chart':
      return <ChartArtifactRenderer kind="line" payload={current.payload} />;
    case 'area-chart':
      return <ChartArtifactRenderer kind="area" payload={current.payload} />;
    case 'pie-chart':
      return <ChartArtifactRenderer kind="pie" payload={current.payload} />;
    case 'radar-chart':
      return <ChartArtifactRenderer kind="radar" payload={current.payload} />;
    case 'radial-chart':
      return <ChartArtifactRenderer kind="radial" payload={current.payload} />;
    default:
      return <p>No artifacts for {current?.type}</p>;
  }
}