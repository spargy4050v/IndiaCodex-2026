"use client";

import { Trophy, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/common/states";
import { cn, formatAda, formatPercent } from "@/lib/utils";
import type { IndexerView } from "@/types";

function repTone(rep: number) {
  if (rep >= 85) return "bg-success";
  if (rep >= 65) return "bg-warning";
  return "bg-destructive";
}

export function IndexerLeaderboard({ indexers }: { indexers: IndexerView[] }) {
  if (indexers.length === 0) {
    return <EmptyState icon={Users} title="No indexers registered" />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Indexer</TableHead>
          <TableHead className="w-[180px]">Reputation</TableHead>
          <TableHead className="text-right">Stake</TableHead>
          <TableHead className="text-right">Accuracy</TableHead>
          <TableHead className="text-right">Claims</TableHead>
          <TableHead className="text-right">Slashed</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {indexers.map((idx, i) => (
          <TableRow key={idx.indexer_id}>
            <TableCell>
              {i === 0 ? (
                <Trophy className="size-4 text-warning" />
              ) : (
                <span className="text-sm text-muted-foreground">{i + 1}</span>
              )}
            </TableCell>
            <TableCell>
              <div className="font-medium">{idx.name}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {idx.indexer_id}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress
                  value={idx.reputation}
                  indicatorClassName={repTone(idx.reputation)}
                  className="h-1.5"
                />
                <span className="w-8 text-right text-xs font-medium">
                  {idx.reputation.toFixed(0)}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right font-mono">{formatAda(idx.stake)}</TableCell>
            <TableCell
              className={cn(
                "text-right font-medium",
                idx.accuracy >= 0.9
                  ? "text-success"
                  : idx.accuracy >= 0.6
                  ? "text-warning"
                  : "text-destructive"
              )}
            >
              {formatPercent(idx.accuracy)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              <span className="text-success">{idx.verified_claims}</span>
              {" / "}
              <span className="text-destructive">{idx.invalid_claims}</span>
            </TableCell>
            <TableCell className="text-right font-mono text-destructive">
              {idx.slashed_amount > 0 ? formatAda(idx.slashed_amount) : "—"}
            </TableCell>
            <TableCell>
              {idx.active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="destructive">Ejected</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
