"use client";

import { ExternalLink, ShieldAlert } from "lucide-react";
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
import type { ChainSettlement, IndexerView, SlashEvent } from "@/types";

export function SlashHistory({
  events,
  indexers = [],
  settlements = [],
}: {
  events: SlashEvent[];
  indexers?: IndexerView[];
  settlements?: ChainSettlement[];
}) {
  const nameFor = (id: string | null) =>
    id ? indexers.find((i) => i.indexer_id === id)?.name ?? shortId(id) : "—";

  const settlementFor = (claimId: string) =>
    settlements.find((s) => s.claim_id === claimId && s.redeemer === "SlashClaim");

  const showChain = settlements.length > 0;

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
          {showChain && <TableHead>On-chain</TableHead>}
          <TableHead className="text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((e) => {
          const settlement = settlementFor(e.claim_id);
          return (
            <TableRow key={e.slash_event_id}>
              <TableCell className="font-medium">{nameFor(e.indexer_id)}</TableCell>
              <TableCell>
                <SlashReasonBadge reason={e.reason} />
              </TableCell>
              <TableCell className="text-right font-mono text-destructive tnum">
                −{formatAda(e.amount_slashed)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {nameFor(e.challenger_id)}
              </TableCell>
              <TableCell className="text-right font-mono text-success tnum">
                {e.challenger_reward > 0 ? `+${formatAda(e.challenger_reward)}` : "—"}
              </TableCell>
              <TableCell className="text-right text-xs tnum">
                <span className="text-muted-foreground">
                  {e.reputation_before.toFixed(0)}
                </span>
                <span className="mx-1 text-muted-foreground">→</span>
                <span className="text-destructive">{e.reputation_after.toFixed(0)}</span>
              </TableCell>
              {showChain && (
                <TableCell>
                  {settlement ? (
                    <a
                      href={settlement.explorer_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      {shortId(settlement.tx_ref, 6, 4)}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatRelativeTime(e.created_at)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
