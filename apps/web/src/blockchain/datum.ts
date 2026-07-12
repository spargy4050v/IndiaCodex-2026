// Plutus data encoders for the shoko validator. The shapes here mirror
// `contracts/aiken/lib/shoko/types.ak` exactly (field order matters).

import { Data } from "@lucid-evolution/lucid";
import type { OnchainClaimDatum } from "./types";

/** Mirrors `ClaimDatum` in the Aiken validator. */
export const ClaimDatumSchema = Data.Object({
  indexer: Data.Bytes(),
  metric: Data.Bytes(),
  claimed_value: Data.Integer(),
  stake: Data.Integer(),
  challenger_reward_bps: Data.Integer(),
  deadline: Data.Integer(),
});
export type ClaimDatumT = Data.Static<typeof ClaimDatumSchema>;
export const ClaimDatum = ClaimDatumSchema as unknown as ClaimDatumT;

/** Mirrors the `Redeemer` enum: FinalizeClaim | SlashClaim { challenger }. */
export const RedeemerSchema = Data.Enum([
  Data.Literal("FinalizeClaim"),
  Data.Object({
    SlashClaim: Data.Object({ challenger: Data.Bytes() }),
  }),
]);
export type RedeemerT = Data.Static<typeof RedeemerSchema>;
export const ShokoRedeemer = RedeemerSchema as unknown as RedeemerT;

export function encodeClaimDatum(d: OnchainClaimDatum): string {
  return Data.to(
    {
      indexer: d.indexer,
      metric: d.metric,
      claimed_value: d.claimedValue,
      stake: d.stake,
      challenger_reward_bps: d.challengerRewardBps,
      deadline: d.deadline,
    },
    ClaimDatum
  );
}

export function decodeClaimDatum(datum: string): OnchainClaimDatum {
  const d = Data.from(datum, ClaimDatum);
  return {
    indexer: d.indexer,
    metric: d.metric,
    claimedValue: d.claimed_value,
    stake: d.stake,
    challengerRewardBps: d.challenger_reward_bps,
    deadline: d.deadline,
  };
}

export function encodeFinalizeRedeemer(): string {
  return Data.to("FinalizeClaim", ShokoRedeemer);
}

export function encodeSlashRedeemer(challenger: string): string {
  return Data.to({ SlashClaim: { challenger } }, ShokoRedeemer);
}
