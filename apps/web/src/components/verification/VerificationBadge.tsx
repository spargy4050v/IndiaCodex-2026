"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  Swords,
  XCircle,
} from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ChallengeOutcome,
  ClaimStatus,
  SlashReason,
  VerificationStatus,
} from "@/types";

type Tone = NonNullable<BadgeProps["variant"]>;

// Strict palette: green = verified, red = slash/invalid, blue = in-flight info,
// neutral = idle.
const CLAIM_MAP: Record<
  ClaimStatus,
  { tone: Tone; label: string; icon: React.ComponentType<{ className?: string }>; spin?: boolean }
> = {
  PENDING: { tone: "outline", label: "Pending", icon: Clock },
  VERIFYING: { tone: "info", label: "Verifying", icon: Loader2, spin: true },
  VERIFIED: { tone: "success", label: "Verified", icon: CheckCircle2 },
  CHALLENGED: { tone: "info", label: "Challenged", icon: Swords },
  INVALID: { tone: "destructive", label: "Invalid", icon: XCircle },
  SLASHED: { tone: "destructive", label: "Slashed", icon: ShieldAlert },
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const { tone, label, icon: Icon, spin } = CLAIM_MAP[status];
  return (
    <Badge variant={tone}>
      <Icon className={cn("size-3", spin && "animate-spin")} />
      {label}
    </Badge>
  );
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return status === "VERIFIED" ? (
    <Badge variant="success">
      <CheckCircle2 className="size-3" /> Verified
    </Badge>
  ) : (
    <Badge variant="destructive">
      <XCircle className="size-3" /> Invalid
    </Badge>
  );
}

export function SlashReasonBadge({ reason }: { reason: SlashReason }) {
  return reason === "FALSE_CLAIM" ? (
    <Badge variant="destructive">False Claim</Badge>
  ) : (
    <Badge variant="destructive">Failed Challenge</Badge>
  );
}

export function ChallengeOutcomeBadge({ outcome }: { outcome: ChallengeOutcome | null }) {
  if (!outcome) return <Badge variant="outline">Open</Badge>;
  return outcome === "UPHELD" ? (
    <Badge variant="destructive">Upheld</Badge>
  ) : (
    <Badge variant="success">Rejected</Badge>
  );
}

export type LiveVerifyPhase = "idle" | "pending" | "verifying" | "verified" | "rejected";

const PHASE: Record<
  LiveVerifyPhase,
  { tone: Tone; label: string; icon: React.ComponentType<{ className?: string }>; spin?: boolean }
> = {
  idle: { tone: "outline", label: "Idle", icon: Clock },
  pending: { tone: "outline", label: "Pending", icon: Clock },
  verifying: { tone: "info", label: "Verifying", icon: Loader2, spin: true },
  verified: { tone: "success", label: "Verified", icon: CheckCircle2 },
  rejected: { tone: "destructive", label: "Rejected", icon: XCircle },
};

/** Animated badge that transitions pending → verifying → verified/rejected. */
export function AnimatedVerificationBadge({
  phase,
  className,
}: {
  phase: LiveVerifyPhase;
  className?: string;
}) {
  const { tone, label, icon: Icon, spin } = PHASE[phase];
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.96 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={cn("inline-flex", className)}
      >
        <Badge variant={tone} className="gap-1.5 px-3 py-1">
          <Icon className={cn("size-3.5", spin && "animate-spin")} />
          {label}
        </Badge>
      </motion.div>
    </AnimatePresence>
  );
}
