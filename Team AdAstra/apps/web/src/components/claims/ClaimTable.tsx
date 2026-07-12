"use client";

import { ScrollText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/states";
import { ClaimStatusBadge } from "@/components/verification/VerificationBadge";
import { formatCompact, formatRelativeTime, shortId } from "@/lib/utils";
import type { Claim, IndexerView } from "@/types";

export function ClaimTable({
  claims,
  indexers = [],
}: {
  claims: Claim[];
  indexers?: IndexerView[];
}) {
  const nameFor = (id: string) =>
    indexers.find((i) => i.indexer_id === id)?.name ?? shortId(id);

  if (claims.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No claims yet"
        description="Submitted indexer claims will appear here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Claim</TableHead>
          <TableHead>Indexer</TableHead>
          <TableHead>Metric</TableHead>
          <TableHead className="text-right">Claimed</TableHead>
          <TableHead className="text-right">Confidence</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {claims.map((claim) => (
          <TableRow key={claim.claim_id}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {shortId(claim.claim_id)}
            </TableCell>
            <TableCell className="font-medium">{nameFor(claim.indexer_id)}</TableCell>
            <TableCell>
              <Badge variant="outline">{claim.metric}</Badge>
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatCompact(claim.claimed_value)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {(claim.confidence * 100).toFixed(0)}%
            </TableCell>
            <TableCell>
              <ClaimStatusBadge status={claim.status} />
            </TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
              {formatRelativeTime(claim.timestamp)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
