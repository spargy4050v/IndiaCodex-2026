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
import type { VerificationPoint } from "@/lib/series";

export function VerificationChart({ data }: { data: VerificationPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="bucket"
          stroke={CHART_COLORS.muted}
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />
        <YAxis
          stroke={CHART_COLORS.muted}
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={28}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(240 5% 12% / 0.5)" }} />
        <Bar
          dataKey="verified"
          name="verified"
          stackId="v"
          fill={CHART_COLORS.success}
          radius={[0, 0, 0, 0]}
          animationDuration={650}
        />
        <Bar
          dataKey="invalid"
          name="invalid"
          stackId="v"
          fill={CHART_COLORS.destructive}
          radius={[4, 4, 0, 0]}
          animationDuration={650}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
