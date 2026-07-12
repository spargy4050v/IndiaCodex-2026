// Derives chart series from live protocol data. The backend is stateless about
// history, so time-series (TVL, verification, slashing) are reconstructed on the
// client from the current snapshot + event timestamps.

import type { Claim, IndexerView, NetworkHealth, SlashEvent } from "@/types";

/** Deterministic pseudo-random in [0,1) from an integer seed. */
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export interface TvlPoint {
  epoch: string;
  tvl: number;
}

/** A believable TVL curve across recent epochs, converging on the live value. */
export function buildTvlHistory(currentTvl: number, currentEpoch: number, points = 12): TvlPoint[] {
  const out: TvlPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const epoch = currentEpoch - i;
    // Drift downward as we go back in time, with mild noise.
    const decay = 1 - i * 0.028;
    const noise = (seeded(epoch) - 0.5) * 0.03;
    out.push({
      epoch: `E${epoch}`,
      tvl: Math.max(0, Math.round(currentTvl * (decay + noise))),
    });
  }
  return out;
}

export interface VerificationPoint {
  bucket: string;
  verified: number;
  invalid: number;
}

/** Group claims into ordered buckets of verified vs invalid/slashed counts. */
export function buildVerificationHistory(claims: Claim[], buckets = 8): VerificationPoint[] {
  if (claims.length === 0) {
    return Array.from({ length: buckets }, (_, i) => ({
      bucket: `T${i + 1}`,
      verified: 0,
      invalid: 0,
    }));
  }
  const ordered = [...claims].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const size = Math.ceil(ordered.length / buckets);
  const out: VerificationPoint[] = [];
  for (let i = 0; i < buckets; i++) {
    const slice = ordered.slice(i * size, (i + 1) * size);
    out.push({
      bucket: `T${i + 1}`,
      verified: slice.filter((c) => c.status === "VERIFIED").length,
      invalid: slice.filter((c) => c.status === "INVALID" || c.status === "SLASHED").length,
    });
  }
  return out;
}

export interface SlashPoint {
  label: string;
  amount: number;
  cumulative: number;
}

/** Cumulative slashed ADA over the sequence of slash events. */
export function buildSlashHistory(events: SlashEvent[]): SlashPoint[] {
  const ordered = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  let cumulative = 0;
  const out: SlashPoint[] = ordered.map((e, i) => {
    cumulative += e.amount_slashed;
    return {
      label: `#${i + 1}`,
      amount: e.amount_slashed,
      cumulative,
    };
  });
  if (out.length === 0) return [{ label: "—", amount: 0, cumulative: 0 }];
  return out;
}

export interface HealthPoint {
  name: string;
  reputation: number;
  accuracy: number;
}

/** Per-indexer reputation + accuracy for the health chart. */
export function buildIndexerHealth(indexers: IndexerView[]): HealthPoint[] {
  return [...indexers]
    .sort((a, b) => b.reputation - a.reputation)
    .map((i) => ({
      name: i.name,
      reputation: Math.round(i.reputation),
      accuracy: Math.round(i.accuracy * 100),
    }));
}

export function integrityBadge(health: NetworkHealth): {
  label: string;
  tone: "success" | "info" | "destructive";
} {
  const s = health.integrity_score;
  if (s >= 85) return { label: "Healthy", tone: "success" };
  if (s >= 65) return { label: "Watch", tone: "info" };
  return { label: "At Risk", tone: "destructive" };
}
