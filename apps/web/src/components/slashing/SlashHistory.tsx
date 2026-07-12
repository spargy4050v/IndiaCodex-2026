"use client";

import { ShieldAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/states";
import { SlashReasonBadge } from "@/components/verification/VerificationBadge";
import { formatAda, formatRelativeTime, shortId } from "@/lib/utils";
import type { IndexerView, SlashEvent } from "@/types";

export function SlashHistory({
  events,
  indexers = [],
}: {
  events: SlashEvent[];
  indexers?: IndexerView[];
}) {
  const nameFor = (id: string | null) =>
    id ? indexers.find((i) => i.indexer_id === id)?.name ?? shortId(id) : "—";

  if (events.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No slash events"
        description="When an indexer is caught making a false claim, it shows up here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Indexer</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead className="text-right">Slashed</TableHead>
          <TableHead>Challenger</TableHead>
          <TableHead className="text-right">Reward</TableHead>
          <TableHead className="text-right">Reputation</TableHead>
          <TableHead className="text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((e) => (
          <TableRow key={e.slash_event_id}>
            <TableCell className="font-medium">{nameFor(e.indexer_id)}</TableCell>
            <TableCell>
              <SlashReasonBadge reason={e.reason} />
            </TableCell>
            <TableCell className="text-right font-mono text-destructive">
              −{formatAda(e.amount_slashed)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {nameFor(e.challenger_id)}
            </TableCell>
            <TableCell className="text-right font-mono text-success">
              {e.challenger_reward > 0 ? `+${formatAda(e.challenger_reward)}` : "—"}
            </TableCell>
            <TableCell className="text-right text-xs">
              <span className="text-muted-foreground">
                {e.reputation_before.toFixed(0)}
              </span>
              <span className="mx-1 text-muted-foreground">→</span>
              <span className="text-destructive">{e.reputation_after.toFixed(0)}</span>
            </TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
              {formatRelativeTime(e.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
