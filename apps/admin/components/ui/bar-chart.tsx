"use client";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "./chart";
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function BarChart({ data }: { data: Array<{ website: string; value: number; name?: string | null; domain?: string | null }> }) {
  // Use name, then domain, then website ID for the label
  const displayData = data.map((d) => ({
    ...d,
    label: d.name || d.domain || d.website,
    tooltip: d.name && d.domain ? `${d.name} (${d.domain})` : d.name || d.domain || d.website
  }));
  return (
    <ChartContainer config={{ value: { label: "Events", color: "#22c55e" } }} className="w-full h-64">
      <ReBarChart data={displayData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(_, __, { payload }) => payload.tooltip} />
        <Legend content={<ChartLegendContent />} />
        <Bar dataKey="value" fill="#22c55e" />
      </ReBarChart>
    </ChartContainer>
  );
} 