import { tool } from "ai";
import { z } from "zod";
import {
  AreaChartArtifact,
  BarChartArtifact,
  LineChartArtifact,
  PieChartArtifact,
  RadarChartArtifact,
  RadialChartArtifact,
} from "../artifacts";

const baseChartInput = z.object({
  title: z.string(),
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  config: z.record(z.string(), z.object({ label: z.string().optional(), color: z.string().optional() })).optional(),
  xKey: z.string().optional(),
  series: z.array(z.string()).optional(),
  nameKey: z.string().optional(),
  valueKey: z.string().optional(),
});

function chartToolFactory(description: string, kind: "bar"|"line"|"area"|"pie"|"radar"|"radial") {
  return tool({
    description,
    inputSchema: baseChartInput,
    execute: async (input) => {
      const artifactByKind = {
        bar: BarChartArtifact,
        line: LineChartArtifact,
        area: AreaChartArtifact,
        pie: PieChartArtifact,
        radar: RadarChartArtifact,
        radial: RadialChartArtifact,
      } as const;

      const Art = artifactByKind[kind];
      const a = Art.stream({ progress: 0, title: input.title, data: [], config: input.config, xKey: input.xKey, series: input.series, nameKey: input.nameKey, valueKey: input.valueKey });

      await a.update({ progress: 0.5, data: input.data });
      await a.complete({ progress: 1, title: input.title, data: input.data, config: input.config, xKey: input.xKey, series: input.series, nameKey: input.nameKey, valueKey: input.valueKey });

      return {
        parts: [
          {
            type: `data-artifact-${Art.id}`,
            data: {
              id: a.id,
              version: 1,
              status: "complete" as const,
              progress: 1,
              payload: a.data,
              createdAt: Date.now(),
            },
          },
        ],
        text: `${input.title} chart generated (${kind}).`,
      };
    },
  });
}

export const barChartTool = chartToolFactory("Create a bar chart artifact from tabular data.", "bar");
export const lineChartTool = chartToolFactory("Create a line chart artifact from time-series or categorical data.", "line");
export const areaChartTool = chartToolFactory("Create an area chart artifact.", "area");
export const pieChartTool = chartToolFactory("Create a pie chart artifact.", "pie");
export const radarChartTool = chartToolFactory("Create a radar chart artifact.", "radar");
export const radialChartTool = chartToolFactory("Create a radial chart artifact.", "radial");


