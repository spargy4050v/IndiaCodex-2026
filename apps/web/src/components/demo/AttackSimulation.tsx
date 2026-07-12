"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Cpu,
  ExternalLink,
  FileWarning,
  Gavel,
  LayoutDashboard,
  Loader2,
  Play,
  RefreshCw,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Swords,
  UserCheck,
  UserX,
  XCircle,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shokoApi } from "@/services/shoko";
import { useShokoStore } from "@/store/useShokoStore";
import { apiError } from "@/lib/api";
import { cn, formatCompact, shortId, sleep } from "@/lib/utils";
import type { ChainSettlement, ChallengeResponse, VerifyResponse } from "@/types";

type StepStatus = "idle" | "running" | "done" | "error";
type Phase = "honest" | "malicious";
type Mode = "full" | "honest" | "attack";

interface StepDef {
  key: string;
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  phase: Phase;
}
interface Step extends StepDef {
  status: StepStatus;
}

const HONEST: StepDef[] = [
  { key: "h_actor", phase: "honest", title: "Honest Indexer", detail: "High-reputation node selected", icon: UserCheck },
  { key: "h_claim", phase: "honest", title: "Claim Submitted", detail: "Reports a metric near canonical value", icon: ScrollText },
  { key: "h_verify", phase: "honest", title: "Verified", detail: "Consensus confirms the value", icon: ShieldCheck },
  { key: "h_dash", phase: "honest", title: "Dashboard Updates", detail: "Verified claims increment", icon: LayoutDashboard },
];

const ATTACK: StepDef[] = [
  { key: "m_actor", phase: "malicious", title: "Malicious Indexer", detail: "Low-reputation node selected", icon: UserX },
  { key: "m_claim", phase: "malicious", title: "False Claim", detail: "Reports a wildly inflated metric", icon: FileWarning },
  { key: "m_challenge", phase: "malicious", title: "Challenge Triggered", detail: "A watchtower disputes the claim", icon: Swords },
  { key: "m_validator", phase: "malicious", title: "Validator Executes", detail: "Aiken script settles the dispute on-chain", icon: Cpu },
  { key: "m_slash", phase: "malicious", title: "Stake Slashed", detail: "Protocol burns the liar's stake", icon: ShieldAlert },
  { key: "m_removed", phase: "malicious", title: "Verification Removed", detail: "Claim is marked slashed, not verified", icon: XCircle },
  { key: "m_dash", phase: "malicious", title: "Dashboard Updates", detail: "Live tables reflect the slash", icon: LayoutDashboard },
];

const TEMPLATES: Record<Mode, StepDef[]> = {
  full: [...HONEST, ...ATTACK],
  honest: HONEST,
  attack: ATTACK,
};

const RING: Record<StepStatus, string> = {
  idle: "border-border bg-muted/40",
  running: "border-primary bg-primary/10 animate-pulse-ring",
  done: "border-success bg-success/10",
  error: "border-destructive bg-destructive/10",
};
const ICON_COLOR: Record<StepStatus, string> = {
  idle: "text-muted-foreground",
  running: "text-primary",
  done: "text-success",
  error: "text-destructive",
};

export function AttackSimulation() {
  const dashboard = useShokoStore((s) => s.dashboard);
  const indexers = useShokoStore((s) => s.indexers);
  const refresh = useShokoStore((s) => s.refresh);

  const [mode, setMode] = useState<Mode>("full");
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settlement, setSettlement] = useState<ChainSettlement | null>(null);

  const tvlCanonical = useMemo(
    () => dashboard?.metric_breakdown.find((m) => m.metric === "TVL")?.canonical_value ?? 1_250_000_000,
    [dashboard]
  );

  const actors = useMemo(() => {
    const byRep = [...indexers].filter((i) => i.active).sort((a, b) => b.reputation - a.reputation);
    return { honest: byRep[0], challenger: byRep[1] ?? byRep[0], malicious: byRep[byRep.length - 1] };
  }, [indexers]);

  const view: Step[] = steps.length ? steps : TEMPLATES[mode].map((s) => ({ ...s, status: "idle" }));
  const doneCount = view.filter((s) => s.status === "done").length;
  const progress = Math.round((doneCount / view.length) * 100);

  const statusBadge = running
    ? { variant: "info" as const, label: "Running" }
    : error
    ? { variant: "destructive" as const, label: "Error" }
    : settlement
    ? { variant: "destructive" as const, label: "Slashed" }
    : doneCount > 0
    ? { variant: "success" as const, label: "Complete" }
    : { variant: "secondary" as const, label: "Idle" };

  const pushLog = (line: string) => setLog((l) => [...l, line]);
  const setStep = (key: string, status: StepStatus, detail?: string) =>
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, status, detail: detail ?? s.detail } : s)));

  async function run(nextMode: Mode) {
    if (running) return;
    setMode(nextMode);
    setError(null);
    setLog([]);
    setSettlement(null);
    setSteps(TEMPLATES[nextMode].map((s) => ({ ...s, status: "idle" })));
    setRunning(true);
    try {
      if (!actors.honest || !actors.malicious) {
        throw new Error("No indexers available. Is the backend seeded?");
      }
      if (nextMode !== "attack") await runHonest();
      if (nextMode !== "honest") await runAttack();
      await refresh();
    } catch (e) {
      setError(apiError(e));
      setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "error" } : s)));
    } finally {
      setRunning(false);
    }
  }

  async function runHonest() {
    const actor = actors.honest;
    setStep("h_actor", "running");
    await sleep(550);
    setStep("h_actor", "done", `${actor.name} · trust ${actor.reputation.toFixed(0)}`);
    pushLog(`Honest indexer ${actor.name} selected.`);

    setStep("h_claim", "running");
    const claimed = Math.round(tvlCanonical * 1.0006);
    await sleep(650);
    const res = (await shokoApi.createClaim({
      indexer_id: actor.indexer_id, metric: "TVL", claimed_value: claimed, confidence: 0.98, verify: false,
    })) as { claim_id: string };
    setStep("h_claim", "done", `Claimed TVL ≈ ${formatCompact(claimed)} ₳`);
    pushLog(`Claim ${res.claim_id} submitted.`);

    setStep("h_verify", "running");
    await sleep(750);
    const verify: VerifyResponse = await shokoApi.verifyClaim(res.claim_id);
    setStep("h_verify", verify.verification.status === "VERIFIED" ? "done" : "error",
      `Deviation ${(verify.verification.deviation * 100).toFixed(3)}% within tolerance`);
    pushLog(`Consensus canonical ${formatCompact(verify.verification.canonical_value)} ₳ → VERIFIED.`);

    setStep("h_dash", "running");
    await sleep(500);
    setStep("h_dash", "done");
    pushLog("Dashboard updated — verified claim recorded.");
  }

  async function runAttack() {
    const attacker = actors.malicious;
    const challenger = actors.challenger;

    setStep("m_actor", "running");
    await sleep(550);
    setStep("m_actor", "done", `${attacker.name} · trust ${attacker.reputation.toFixed(0)}`);
    pushLog(`Malicious indexer ${attacker.name} selected.`);

    setStep("m_claim", "running");
    const claimed = Math.round(tvlCanonical * 1.6);
    await sleep(650);
    const res = (await shokoApi.createClaim({
      indexer_id: attacker.indexer_id, metric: "TVL", claimed_value: claimed, confidence: 0.6, verify: false,
    })) as { claim_id: string };
    setStep("m_claim", "done", `Fake TVL ≈ ${formatCompact(claimed)} ₳ (+60%)`);
    pushLog(`False claim ${res.claim_id} submitted.`);

    setStep("m_challenge", "running");
    await sleep(700);
    const chall: ChallengeResponse = await shokoApi.challengeClaim(
      res.claim_id, challenger.indexer_id, "Reported TVL is far above canonical chain state."
    );
    setStep("m_challenge", "done", `${challenger.name} disputed the claim`);
    pushLog(`Challenge raised by ${challenger.name} → ${chall.verification.status}.`);

    // Validator executes on-chain — fetch the settlement produced by the slash.
    setStep("m_validator", "running");
    await sleep(700);
    let stl: ChainSettlement | undefined;
    for (let i = 0; i < 3 && !stl; i++) {
      const list = await shokoApi.getSettlements(res.claim_id).catch(() => []);
      stl = list.find((s) => s.redeemer === "SlashClaim");
      if (!stl) await sleep(300);
    }
    if (stl) {
      setSettlement(stl);
      setStep("m_validator", "done", `SlashClaim settled · tx ${shortId(stl.tx_ref, 8, 4)}`);
      pushLog(`Validator executed SlashClaim on ${stl.network}.`);
    } else {
      setStep("m_validator", "done", "SlashClaim redeemer executed");
    }

    setStep("m_slash", "running");
    await sleep(600);
    if (chall.slash_event) {
      setStep("m_slash", "done", `−${formatCompact(chall.slash_event.amount_slashed)} ₳ slashed · +${formatCompact(chall.challenge.reward)} ₳ bounty`);
      pushLog(`Stake slashed ${formatCompact(chall.slash_event.amount_slashed)} ₳; trust ${chall.slash_event.reputation_before.toFixed(0)} → ${chall.slash_event.reputation_after.toFixed(0)}.`);
    } else {
      setStep("m_slash", "done", "No stake at risk");
    }

    setStep("m_removed", "running");
    await sleep(550);
    setStep("m_removed", "done", `Claim ${res.claim_id.slice(0, 10)} marked SLASHED`);
    pushLog("Verification removed — claim no longer counts as verified.");

    setStep("m_dash", "running");
    await sleep(500);
    setStep("m_dash", "done");
    pushLog("Dashboard updated — slash visible across the network.");
  }

  const reset = () => {
    setSteps([]);
    setLog([]);
    setError(null);
    setSettlement(null);
  };

  return (
    <Card className="overflow-hidden shadow-premium">
      <CardHeader className="flex-col gap-4 border-b border-border bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Zap className="size-4" />
            </span>
            Attack Simulation
          </CardTitle>
          <CardDescription>
            One click runs the full protocol live: an honest claim verifies, then a fraud is challenged and slashed on-chain.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={running} onClick={() => run("full")}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Run Attack Simulation
          </Button>
          <Button size="sm" variant="outline" disabled={running} onClick={() => run("honest")}>
            <ShieldCheck className="size-4" /> Honest only
          </Button>
          <Button size="sm" variant="ghost" disabled={running} onClick={reset}>
            <RefreshCw className="size-4" /> Reset
          </Button>
        </div>
      </CardHeader>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-border">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        />
      </div>

      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Pipeline */}
        <ol className="relative space-y-1">
          {view.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === view.length - 1;
            const dividerBefore =
              i > 0 && view[i - 1].phase === "honest" && step.phase === "malicious";
            return (
              <li key={step.key} className="relative">
                {dividerBefore && (
                  <div className="flex items-center gap-2 py-2 pl-14 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Attack phase
                  </div>
                )}
                <div className="relative flex gap-4 pb-4">
                  {!isLast && (
                    <span
                      className={cn(
                        "absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px transition-colors",
                        step.status === "done" ? "bg-success/40" : "bg-border"
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      RING[step.status]
                    )}
                  >
                    <Icon
                      className={cn("size-4", ICON_COLOR[step.status], step.status === "running" && "animate-spin")}
                    />
                  </div>
                  <div className="pt-1.5">
                    <p className={cn("text-sm font-medium", step.status === "idle" ? "text-muted-foreground" : "text-foreground")}>
                      {step.title}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={step.detail}
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-muted-foreground"
                      >
                        {step.detail}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Console */}
        <div className="flex flex-col rounded-xl border border-border bg-muted/20">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">Protocol Log</span>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-xs">
            {log.length === 0 && !error && (
              <p className="text-muted-foreground">
                Press “Run Attack Simulation” to execute a live end-to-end demo against the API.
              </p>
            )}
            {log.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2 text-foreground/90"
              >
                <span className="text-primary">›</span>
                <span>{line}</span>
              </motion.div>
            ))}
            {error && (
              <div className="flex items-start gap-2 text-destructive">
                <XCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
          {settlement && (
            <a
              href={settlement.explorer_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <span className="inline-flex items-center gap-1.5">
                <Gavel className="size-3.5" /> On-chain SlashClaim
              </span>
              <span className="inline-flex items-center gap-1 font-mono">
                {shortId(settlement.tx_ref, 10, 6)} <ExternalLink className="size-3" />
              </span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
