"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, ChartTooltip } from "./ChartCard";
import type { HealthPoint } from "@/lib/series";

export function IndexerHealthChart({ data }: { data: HealthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
        barCategoryGap={10}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          stroke={CHART_COLORS.muted}
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke={CHART_COLORS.muted}
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={90}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(240 5% 12% / 0.5)" }} />
        <Bar dataKey="reputation" name="reputation" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        <Bar dataKey="accuracy" name="accuracy" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
