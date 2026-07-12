"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Loader2, Wand2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { shokoApi } from "@/services/shoko";
import { useShokoStore } from "@/store/useShokoStore";
import { apiError } from "@/lib/api";
import { formatCompact } from "@/lib/utils";
import type { Metric, VerifyResponse } from "@/types";

const METRICS: Metric[] = [
  "TVL",
  "STAKE_POOL_HEALTH",
  "WALLET_ACTIVITY",
  "DREP_VOTES",
  "TRANSACTIONS",
  "EPOCH",
];

export function VerificationConsole() {
  const { dashboard, indexers, refresh } = useShokoStore();

  const [indexerId, setIndexerId] = useState("");
  const [metric, setMetric] = useState<Metric>("TVL");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const canonical = useMemo(
    () =>
      dashboard?.metric_breakdown.find((m) => m.metric === metric)?.canonical_value ??
      0,
    [dashboard, metric]
  );

  const activeIndexer = indexerId || indexers[0]?.indexer_id || "";

  function fill(kind: "honest" | "fraud") {
    const base = canonical || 1;
    setValue(String(Math.round(kind === "honest" ? base * 1.0005 : base * 1.7)));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = (await shokoApi.createClaim({
        indexer_id: activeIndexer,
        metric,
        claimed_value: Number(value),
        verify: true,
      })) as VerifyResponse;
      setResult(res);
      await refresh();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  const v = result?.verification;
  const withinPct = v ? Math.min(100, (v.deviation / (v.tolerance || 1e-9)) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="size-4 text-primary" />
          Verification Console
        </CardTitle>
        <CardDescription>
          Submit a metric claim and verify it against canonical consensus data in real time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Indexer</Label>
            <Select
              value={activeIndexer}
              onChange={(e) => setIndexerId(e.target.value)}
              disabled={busy}
            >
              {indexers.map((i) => (
                <option key={i.indexer_id} value={i.indexer_id}>
                  {i.name} · rep {i.reputation.toFixed(0)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Metric</Label>
            <Select
              value={metric}
              onChange={(e) => setMetric(e.target.value as Metric)}
              disabled={busy}
            >
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Claimed Value</Label>
            <span className="text-xs text-muted-foreground">
              canonical ≈ {formatCompact(canonical)}
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter claimed value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={busy}
            />
            <Button variant="outline" size="sm" onClick={() => fill("honest")} disabled={busy}>
              Honest
            </Button>
            <Button variant="outline" size="sm" onClick={() => fill("fraud")} disabled={busy}>
              Fraud
            </Button>
          </div>
        </div>

        <Button onClick={submit} disabled={busy || !value || !activeIndexer} className="w-full">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          Submit &amp; Verify
        </Button>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {v && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Result</span>
              <VerificationBadge status={v.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Claimed</p>
                <p className="font-mono">{formatCompact(v.claimed_value)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Canonical</p>
                <p className="font-mono">{formatCompact(v.canonical_value)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deviation</p>
                <p className="font-mono">{(v.deviation * 100).toFixed(3)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tolerance</p>
                <p className="font-mono">{(v.tolerance * 100).toFixed(2)}%</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Deviation vs. tolerance</span>
                <span>{withinPct.toFixed(0)}%</span>
              </div>
              <Progress
                value={withinPct}
                indicatorClassName={v.status === "VERIFIED" ? "bg-success" : "bg-destructive"}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Provider Consensus ({(v.agreement_ratio * 100).toFixed(0)}% agreement)
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(v.provider_values).map(([name, val]) => (
                  <span
                    key={name}
                    className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                  >
                    <span className="capitalize text-muted-foreground">{name}:</span>{" "}
                    {formatCompact(val)}
                  </span>
                ))}
              </div>
            </div>

            {result?.slash_event && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                Indexer slashed −{formatCompact(result.slash_event.amount_slashed)} ₳ for a false claim.
              </p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
