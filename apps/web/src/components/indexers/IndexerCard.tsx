"use client";

import { Activity, Coins, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MotionCard } from "@/components/ui/motion";
import { cn, formatAda, formatPercent, formatRelativeTime } from "@/lib/utils";
import type { IndexerView } from "@/types";

// Deterministic gradient avatar from the indexer id.
function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 60% 45%), hsl(${(h + 40) % 360} 65% 35%))`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function trustTone(rep: number) {
  if (rep >= 85) return "bg-success";
  if (rep >= 65) return "bg-primary";
  return "bg-destructive";
}

export function IndexerCard({
  indexer,
  lastActivity,
  rank,
}: {
  indexer: IndexerView;
  lastActivity?: string;
  rank?: number;
}) {
  return (
    <MotionCard className="p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm"
          style={{ background: avatarGradient(indexer.indexer_id) }}
        >
          {initials(indexer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-foreground">{indexer.name}</p>
            {rank === 0 && (
              <Badge variant="info" className="px-1.5 text-[10px]">
                Top
              </Badge>
            )}
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {indexer.indexer_id}
          </p>
        </div>
        {indexer.active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="destructive">Ejected</Badge>
        )}
      </div>

      {/* Trust score */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Trust Score</span>
          <span className="font-medium tnum">{indexer.reputation.toFixed(0)} / 100</span>
        </div>
        <Progress
          value={indexer.reputation}
          indicatorClassName={trustTone(indexer.reputation)}
          className="h-1.5"
        />
      </div>

      {/* Metrics grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Coins className="size-4 text-muted-foreground" />
          <div>
            <p className="text-[11px] text-muted-foreground">Stake</p>
            <p className="font-medium tnum">{formatAda(indexer.stake)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 text-muted-foreground" />
          <div>
            <p className="text-[11px] text-muted-foreground">Claims</p>
            <p className="font-medium tnum">
              <span className="text-success">{indexer.verified_claims}</span>
              <span className="text-muted-foreground">/{indexer.total_claims}</span>
            </p>
          </div>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Verification</p>
          <p
            className={cn(
              "font-medium tnum",
              indexer.accuracy >= 0.9
                ? "text-success"
                : indexer.accuracy >= 0.6
                ? "text-foreground"
                : "text-destructive"
            )}
          >
            {formatPercent(indexer.accuracy)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Slashed</p>
          <p className={cn("font-medium tnum", indexer.slashed_amount > 0 && "text-destructive")}>
            {indexer.slashed_amount > 0 ? `−${formatAda(indexer.slashed_amount)}` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <Activity className="size-3.5" />
        Last activity {lastActivity ? formatRelativeTime(lastActivity) : "—"}
      </div>
    </MotionCard>
  );
}
