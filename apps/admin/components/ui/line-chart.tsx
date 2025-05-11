"use client";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "./chart";
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function LineChart({ data }: { data: Array<{ date: string; value: number }> }) {
  return (
    <ChartContainer config={{ value: { label: "Events", color: "#2563eb" } }} className="w-full h-64">
      <ReLineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
      </ReLineChart>
    </ChartContainer>
  );
} 