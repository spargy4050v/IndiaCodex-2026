"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, ChartTooltip } from "./ChartCard";
import { formatCompact } from "@/lib/utils";
import type { SlashPoint } from "@/lib/series";

export function SlashChart({ data }: { data: SlashPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="slashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.destructive} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.destructive} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="label"
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
          width={44}
          tickFormatter={(v) => formatCompact(v as number, 1)}
        />
        <Tooltip
          content={<ChartTooltip formatter={(v) => `${formatCompact(v)} ₳`} />}
          cursor={{ stroke: CHART_COLORS.grid }}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          name="cumulative slashed"
          stroke={CHART_COLORS.destructive}
          strokeWidth={2}
          fill="url(#slashFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
