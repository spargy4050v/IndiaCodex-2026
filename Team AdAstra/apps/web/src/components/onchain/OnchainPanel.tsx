"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, ExternalLink, Link2, ShieldCheck, ShieldX } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/states";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn, formatCompact, formatRelativeTime, shortId } from "@/lib/utils";
import type { ChainSettlement, ScriptInfo } from "@/types";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Copy"
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function SettlementRow({ s }: { s: ChainSettlement }) {
  const slash = s.redeemer === "SlashClaim";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2.5"
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          slash ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success"
        )}
      >
        {slash ? <ShieldX className="size-4" /> : <ShieldCheck className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {slash ? "SlashClaim" : "FinalizeClaim"}
          </span>
          <Badge variant="outline" className="px-1.5 text-[10px]">
            {s.metric}
          </Badge>
        </div>
        <a
          href={s.explorer_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          {shortId(s.tx_ref, 10, 6)}
          <ExternalLink className="size-3" />
        </a>
      </div>
      <div className="text-right">
        {slash && s.reward_lovelace > 0 ? (
          <span className="text-xs font-medium text-success">
            +{formatCompact(s.reward_lovelace / 1_000_000)} ₳
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {formatCompact(s.lovelace / 1_000_000)} ₳
          </span>
        )}
        <p className="text-[11px] text-muted-foreground">
          {formatRelativeTime(s.created_at)}
        </p>
      </div>
    </motion.li>
  );
}

export function OnchainPanel({
  info,
  settlements,
}: {
  info: ScriptInfo | null;
  settlements: ChainSettlement[];
}) {
  return (
    <Card className="card-hover">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-4 text-primary" />
          On-Chain Settlement
        </CardTitle>
        <Badge variant="info">{info?.plutus_version ?? "PlutusV3"}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Stake Locked
            </p>
            <p className="mt-1 text-lg font-semibold tnum">
              <AnimatedCounter
                value={info?.total_locked_ada ?? 0}
                format={(n) => `${formatCompact(n)} ₳`}
              />
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Challenger Paid
            </p>
            <p className="mt-1 text-lg font-semibold tnum text-success">
              <AnimatedCounter
                value={(info?.total_challenger_rewards_lovelace ?? 0) / 1_000_000}
                format={(n) => `${formatCompact(n)} ₳`}
              />
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {info?.validator ?? "claim_validator"} · {info?.network ?? "Preprod"}
            </p>
            <p className="truncate font-mono text-xs text-foreground">
              {info?.script_address ? shortId(info.script_address, 14, 8) : "—"}
            </p>
          </div>
          {info?.script_address && <CopyButton value={info.script_address} />}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Recent settlements
          </p>
          {settlements.length === 0 ? (
            <EmptyState
              title="No settlements yet"
              description="Verified and slashed claims settle here."
              className="py-6"
            />
          ) : (
            <ul className="divide-y divide-border">
              <AnimatePresence initial={false}>
                {settlements.slice(0, 5).map((s) => (
                  <SettlementRow key={s.settlement_id} s={s} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
