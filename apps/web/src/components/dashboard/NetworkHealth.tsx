import { Activity, ShieldCheck, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { integrityBadge } from "@/lib/series";
import { cn, formatAda, formatPercent } from "@/lib/utils";
import type { NetworkHealth as NetworkHealthType } from "@/types";

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-semibold text-foreground", className)}>
        {value}
      </p>
    </div>
  );
}

export function NetworkHealthCard({ health }: { health: NetworkHealthType }) {
  const badge = integrityBadge(health);
  const toneRing =
    badge.tone === "success"
      ? "text-success"
      : badge.tone === "info"
      ? "text-primary"
      : "text-destructive";
  const toneBar =
    badge.tone === "success"
      ? "bg-success"
      : badge.tone === "info"
      ? "bg-primary"
      : "bg-destructive";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          Network Health
        </CardTitle>
        <Badge variant={badge.tone}>{badge.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end gap-4">
          <div>
            <p className={cn("text-4xl font-bold tracking-tight", toneRing)}>
              {health.integrity_score.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Integrity score / 100</p>
          </div>
          <div className="flex-1 pb-1">
            <Progress value={health.integrity_score} indicatorClassName={toneBar} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Verify Rate"
            value={formatPercent(health.verification_rate)}
            className="text-success"
          />
          <Stat label="Avg Reputation" value={health.average_reputation.toFixed(1)} />
          <Stat label="Total Stake" value={formatAda(health.total_stake)} />
          <Stat
            label="Slashed"
            value={formatAda(health.total_slashed)}
            className="text-destructive"
          />
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-success" />
            {health.verified_claims} verified
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-primary" />
            {health.total_challenges} challenges
          </span>
          <span>Epoch {health.current_epoch}</span>
        </div>
      </CardContent>
    </Card>
  );
}
