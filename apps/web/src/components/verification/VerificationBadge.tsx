import {
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  Swords,
  XCircle,
} from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type {
  ChallengeOutcome,
  ClaimStatus,
  SlashReason,
  VerificationStatus,
} from "@/types";

type Tone = NonNullable<BadgeProps["variant"]>;

const CLAIM_MAP: Record<
  ClaimStatus,
  { tone: Tone; label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: { tone: "outline", label: "Pending", icon: Clock },
  VERIFYING: { tone: "warning", label: "Verifying", icon: Loader2 },
  VERIFIED: { tone: "success", label: "Verified", icon: CheckCircle2 },
  CHALLENGED: { tone: "warning", label: "Challenged", icon: Swords },
  INVALID: { tone: "destructive", label: "Invalid", icon: XCircle },
  SLASHED: { tone: "destructive", label: "Slashed", icon: ShieldAlert },
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const { tone, label, icon: Icon } = CLAIM_MAP[status];
  return (
    <Badge variant={tone}>
      <Icon className={status === "VERIFYING" ? "size-3 animate-spin" : "size-3"} />
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
    <Badge variant="warning">Failed Challenge</Badge>
  );
}

export function ChallengeOutcomeBadge({ outcome }: { outcome: ChallengeOutcome | null }) {
  if (!outcome) return <Badge variant="outline">Open</Badge>;
  return outcome === "UPHELD" ? (
    <Badge variant="destructive">Upheld</Badge>
  ) : (
    <Badge variant="secondary">Rejected</Badge>
  );
}
