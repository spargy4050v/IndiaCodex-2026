"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCompact } from "@/lib/utils";
import type { MetricBreakdown, MetricMeta } from "@/types";

export function MetricConsensus({
  breakdown,
  metadata,
}: {
  breakdown: MetricBreakdown[];
  metadata: Record<string, MetricMeta>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Canonical Metrics</CardTitle>
        <CardDescription>
          Ground-truth values and per-metric verification outcomes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {breakdown.map((m) => {
          const meta = metadata[m.metric];
          const resolved = m.verified + m.invalid;
          const rate = resolved ? (m.verified / resolved) * 100 : 100;
          return (
            <div key={m.metric} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{meta?.label ?? m.metric}</p>
                  <p className="text-xs text-muted-foreground">{m.metric}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{formatCompact(m.canonical_value)}</p>
                  <p className="text-xs text-muted-foreground">{meta?.unit}</p>
                </div>
              </div>
              <Progress
                value={rate}
                indicatorClassName={rate >= 80 ? "bg-success" : rate >= 50 ? "bg-warning" : "bg-destructive"}
                className="h-1.5"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{m.total} claims</span>
                <span>
                  <span className="text-success">{m.verified} ✓</span>
                  {" · "}
                  <span className="text-destructive">{m.invalid} ✗</span>
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
