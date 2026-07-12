"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  FileWarning,
  Gavel,
  LayoutDashboard,
  Loader2,
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
import { cn, formatCompact, sleep } from "@/lib/utils";
import type { ChallengeResponse, VerifyResponse } from "@/types";

type StepStatus = "idle" | "running" | "done" | "error";
type Mode = "honest" | "attack";

interface Step {
  key: string;
  title: string;
  detail?: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
}

const HONEST_STEPS: Omit<Step, "status">[] = [
  { key: "actor", title: "Honest Indexer", detail: "High-reputation node selected", icon: UserCheck },
  { key: "claim", title: "Claim Submitted", detail: "Reports on-chain metric near canonical value", icon: ScrollText },
  { key: "verify", title: "Verified", detail: "Consensus confirms the value", icon: ShieldCheck },
  { key: "dashboard", title: "Dashboard Updates", detail: "Verified claim count increases", icon: LayoutDashboard },
];

const ATTACK_STEPS: Omit<Step, "status">[] = [
  { key: "actor", title: "Malicious Indexer", detail: "Low-reputation node selected", icon: UserX },
  { key: "claim", title: "False Claim", detail: "Reports a wildly inflated metric", icon: FileWarning },
  { key: "challenge", title: "Challenge Raised", detail: "A watchtower disputes the claim", icon: Swords },
  { key: "failed", title: "Verification Failed", detail: "Claim deviates beyond tolerance", icon: XCircle },
  { key: "slash", title: "Stake Slashed", detail: "Protocol burns the liar's stake", icon: ShieldAlert },
  { key: "event", title: "Slash Event Added", detail: "Challenger rewarded from the slash", icon: Gavel },
  { key: "dashboard", title: "Dashboard Updates", detail: "Live tables reflect the slash", icon: LayoutDashboard },
];

const STATUS_STYLES: Record<StepStatus, { ring: string; icon: string }> = {
  idle: { ring: "border-border bg-muted/40", icon: "text-muted-foreground" },
  running: { ring: "border-primary bg-primary/10 animate-pulse-ring", icon: "text-primary" },
  done: { ring: "border-success bg-success/10", icon: "text-success" },
  error: { ring: "border-destructive bg-destructive/10", icon: "text-destructive" },
};

export function AttackSimulation() {
  const dashboard = useShokoStore((s) => s.dashboard);
  const indexers = useShokoStore((s) => s.indexers);
  const refresh = useShokoStore((s) => s.refresh);

  const [mode, setMode] = useState<Mode>("attack");
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const tvlCanonical = useMemo(() => {
    const b = dashboard?.metric_breakdown.find((m) => m.metric === "TVL");
    return b?.canonical_value ?? 1_250_000_000;
  }, [dashboard]);

  const actors = useMemo(() => {
    const active = [...indexers].filter((i) => i.active);
    const byRep = [...active].sort((a, b) => b.reputation - a.reputation);
    return {
      honest: byRep[0],
      challenger: byRep[1] ?? byRep[0],
      malicious: byRep[byRep.length - 1],
    };
  }, [indexers]);

  const template = mode === "honest" ? HONEST_STEPS : ATTACK_STEPS;
  const view: Step[] =
    steps.length > 0 ? steps : template.map((s) => ({ ...s, status: "idle" }));

  function pushLog(line: string) {
    setLog((l) => [...l, line]);
  }

  function setStep(key: string, status: StepStatus, detail?: string) {
    setSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, status, detail: detail ?? s.detail } : s))
    );
  }

  async function run(nextMode: Mode) {
    if (running) return;
    setMode(nextMode);
    setError(null);
    setLog([]);
    const initial = (nextMode === "honest" ? HONEST_STEPS : ATTACK_STEPS).map((s) => ({
      ...s,
      status: "idle" as StepStatus,
    }));
    setSteps(initial);
    setRunning(true);

    try {
      if (!actors.honest || !actors.malicious) {
        throw new Error("No indexers available. Is the backend seeded?");
      }
      if (nextMode === "honest") await runHonest();
      else await runAttack();
      await refresh();
    } catch (e) {
      const msg = apiError(e);
      setError(msg);
      setSteps((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "error" } : s))
      );
    } finally {
      setRunning(false);
    }
  }

  async function runHonest() {
    const actor = actors.honest;
    setStep("actor", "running");
    await sleep(600);
    setStep("actor", "done", `${actor.name} · rep ${actor.reputation.toFixed(0)}`);
    pushLog(`Selected honest indexer ${actor.name}.`);

    setStep("claim", "running");
    const claimed = Math.round(tvlCanonical * 1.0006);
    await sleep(700);
    const res = (await shokoApi.createClaim({
      indexer_id: actor.indexer_id,
      metric: "TVL",
      claimed_value: claimed,
      confidence: 0.98,
      verify: false,
    })) as { claim_id: string };
    setStep("claim", "done", `Claimed TVL ≈ ${formatCompact(claimed)} ₳`);
    pushLog(`Claim ${res.claim_id} submitted for TVL.`);

    setStep("verify", "running");
    await sleep(800);
    const verify: VerifyResponse = await shokoApi.verifyClaim(res.claim_id);
    if (verify.verification.status !== "VERIFIED") {
      setStep("verify", "error", "Unexpectedly rejected");
      throw new Error("Honest claim was not verified.");
    }
    setStep(
      "verify",
      "done",
      `Deviation ${(verify.verification.deviation * 100).toFixed(3)}% within tolerance`
    );
    pushLog(`Consensus canonical = ${formatCompact(verify.verification.canonical_value)} ₳ → VERIFIED.`);

    setStep("dashboard", "running");
    await sleep(600);
    setStep("dashboard", "done");
    pushLog("Dashboard refreshed — verified claims incremented.");
  }

  async function runAttack() {
    const attacker = actors.malicious;
    const challenger = actors.challenger;

    setStep("actor", "running");
    await sleep(600);
    setStep("actor", "done", `${attacker.name} · rep ${attacker.reputation.toFixed(0)}`);
    pushLog(`Selected malicious indexer ${attacker.name}.`);

    setStep("claim", "running");
    const claimed = Math.round(tvlCanonical * 1.6);
    await sleep(700);
    const res = (await shokoApi.createClaim({
      indexer_id: attacker.indexer_id,
      metric: "TVL",
      claimed_value: claimed,
      confidence: 0.6,
      verify: false,
    })) as { claim_id: string };
    setStep("claim", "done", `Fake TVL ≈ ${formatCompact(claimed)} ₳ (+60%)`);
    pushLog(`False claim ${res.claim_id} submitted.`);

    setStep("challenge", "running");
    await sleep(800);
    const chall: ChallengeResponse = await shokoApi.challengeClaim(
      res.claim_id,
      challenger.indexer_id,
      "Reported TVL is far above canonical chain state."
    );
    setStep("challenge", "done", `${challenger.name} challenged the claim`);
    pushLog(`Challenge raised by ${challenger.name}.`);

    setStep("failed", "running");
    await sleep(700);
    setStep(
      "failed",
      chall.verification.status === "INVALID" ? "done" : "error",
      `Deviation ${(chall.verification.deviation * 100).toFixed(1)}% ≫ tolerance`
    );
    pushLog(`Re-verification: ${chall.verification.status}.`);

    setStep("slash", "running");
    await sleep(700);
    if (chall.slash_event) {
      setStep(
        "slash",
        "done",
        `−${formatCompact(chall.slash_event.amount_slashed)} ₳ slashed`
      );
      pushLog(
        `Stake slashed by ${formatCompact(chall.slash_event.amount_slashed)} ₳; reputation ${chall.slash_event.reputation_before.toFixed(
          0
        )} → ${chall.slash_event.reputation_after.toFixed(0)}.`
      );
    } else {
      setStep("slash", "done", "No stake at risk");
    }

    setStep("event", "running");
    await sleep(600);
    const reward = chall.challenge.reward;
    setStep(
      "event",
      "done",
      reward > 0 ? `Challenger earned +${formatCompact(reward)} ₳` : "Event recorded"
    );
    pushLog(`Slash event recorded. Outcome: ${chall.challenge.outcome}.`);

    setStep("dashboard", "running");
    await sleep(600);
    setStep("dashboard", "done");
    pushLog("Dashboard refreshed — slash event visible in tables.");
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-primary" />
            Attack Simulation
          </CardTitle>
          <CardDescription>
            Run the protocol live — watch an honest flow verify, then watch a fraud get slashed.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={mode === "honest" ? "success" : "outline"}
            disabled={running}
            onClick={() => run("honest")}
          >
            {running && mode === "honest" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Honest Flow
          </Button>
          <Button
            size="sm"
            variant={mode === "attack" ? "destructive" : "outline"}
            disabled={running}
            onClick={() => run("attack")}
          >
            {running && mode === "attack" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldAlert className="size-4" />
            )}
            Run Attack
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={running}
            onClick={() => {
              setSteps([]);
              setLog([]);
              setError(null);
            }}
          >
            <RefreshCw className="size-4" />
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Pipeline */}
        <ol className="relative space-y-1">
          {view.map((step, i) => {
            const s = STATUS_STYLES[step.status];
            const Icon =
              step.status === "running" ? Loader2 : step.status === "done" ? step.icon : step.icon;
            return (
              <li key={step.key} className="relative flex gap-4 pb-4 last:pb-0">
                {i < view.length - 1 && (
                  <span
                    className={cn(
                      "absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px",
                      step.status === "done" ? "bg-success/50" : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    s.ring
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      s.icon,
                      step.status === "running" && "animate-spin"
                    )}
                  />
                </div>
                <div className="pt-1.5">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.status === "idle" ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
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
              </li>
            );
          })}
        </ol>

        {/* Console */}
        <div className="flex flex-col rounded-xl border border-border bg-muted/20">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">Protocol Log</span>
            <Badge variant={running ? "warning" : error ? "destructive" : "secondary"}>
              {running ? "Running" : error ? "Error" : "Idle"}
            </Badge>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-xs">
            {log.length === 0 && !error && (
              <p className="text-muted-foreground">
                Press “Run Attack” to execute a live end-to-end demo against the API.
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
        </div>
      </CardContent>
    </Card>
  );
}
