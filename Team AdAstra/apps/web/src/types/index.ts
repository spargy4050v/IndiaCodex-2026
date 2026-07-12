// Types mirroring the shoko FastAPI protocol/schemas.

export type Metric =
  | "TVL"
  | "STAKE_POOL_HEALTH"
  | "WALLET_ACTIVITY"
  | "DREP_VOTES"
  | "TRANSACTIONS"
  | "EPOCH";

export type ClaimStatus =
  | "PENDING"
  | "VERIFYING"
  | "VERIFIED"
  | "CHALLENGED"
  | "INVALID"
  | "SLASHED";

export type VerificationStatus = "VERIFIED" | "INVALID";
export type SlashReason = "FALSE_CLAIM" | "FAILED_CHALLENGE";
export type ChallengeOutcome = "UPHELD" | "REJECTED";

export interface Claim {
  claim_id: string;
  indexer_id: string;
  metric: Metric;
  claimed_value: number;
  timestamp: string;
  status: ClaimStatus;
  confidence: number;
}

export interface IndexerView {
  indexer_id: string;
  name: string;
  stake: number;
  reputation: number;
  total_claims: number;
  verified_claims: number;
  invalid_claims: number;
  slashed_amount: number;
  accuracy: number;
  active: boolean;
  joined_epoch: number;
}

export interface Indexer extends IndexerView {}

export interface VerificationResult {
  verification_id: string;
  claim_id: string;
  metric: Metric;
  claimed_value: number;
  canonical_value: number;
  deviation: number;
  tolerance: number;
  status: VerificationStatus;
  agreement_ratio: number;
  provider_values: Record<string, number>;
  verified_at: string;
}

export interface SlashEvent {
  slash_event_id: string;
  indexer_id: string;
  claim_id: string;
  reason: SlashReason;
  amount_slashed: number;
  challenger_id: string | null;
  challenger_reward: number;
  reputation_before: number;
  reputation_after: number;
  stake_before: number;
  stake_after: number;
  created_at: string;
}

export interface Challenge {
  challenge_id: string;
  claim_id: string;
  challenger_id: string;
  reason: string;
  created_at: string;
  resolved: boolean;
  outcome: ChallengeOutcome | null;
  reward: number;
  resolved_at: string | null;
}

export interface MetricBreakdown {
  metric: Metric;
  total: number;
  verified: number;
  invalid: number;
  canonical_value: number;
}

export interface NetworkHealth {
  total_indexers: number;
  active_indexers: number;
  total_claims: number;
  verified_claims: number;
  invalid_claims: number;
  pending_claims: number;
  total_stake: number;
  total_slashed: number;
  total_challenges: number;
  verification_rate: number;
  integrity_score: number;
  average_reputation: number;
  current_epoch: number;
  updated_at: string;
}

export interface MetricMeta {
  label: string;
  unit: string;
  description: string;
  format: string;
}

export interface DashboardResponse {
  network_health: NetworkHealth;
  indexers: IndexerView[];
  recent_claims: Claim[];
  recent_slash_events: SlashEvent[];
  metric_breakdown: MetricBreakdown[];
  metric_metadata: Record<string, MetricMeta>;
}

export interface VerifyResponse {
  claim: Claim;
  verification: VerificationResult;
  slash_event: SlashEvent | null;
}

export interface ChallengeResponse {
  challenge: Challenge;
  claim: Claim;
  verification: VerificationResult;
  slash_event: SlashEvent | null;
}

export interface ChainSnapshot {
  network: string;
  epoch: number;
  updated_at: string;
  canonical_metrics: Record<string, number>;
  stake_pools: Array<Record<string, unknown>>;
  dreps: Array<Record<string, unknown>>;
  wallets: Record<string, number>;
}

export interface CreateClaimPayload {
  indexer_id: string;
  metric: Metric;
  claimed_value: number;
  confidence?: number;
  verify?: boolean;
}

export type SettlementRedeemer = "SubmitClaim" | "FinalizeClaim" | "SlashClaim";

export interface ChainSettlement {
  settlement_id: string;
  action: string; // FINALIZE_CLAIM | SLASH_CLAIM | LOCK_STAKE
  redeemer: SettlementRedeemer;
  claim_id: string;
  indexer_id: string;
  challenger_id: string | null;
  metric: string;
  claimed_value: number;
  lovelace: number;
  reward_lovelace: number;
  network: string;
  script_address: string;
  datum: Record<string, unknown>;
  redeemer_data: Record<string, unknown>;
  tx_ref: string;
  status: string;
  explorer_url: string;
  created_at: string;
}

export interface ScriptInfo {
  network: string;
  script_address: string;
  challenger_reward_bps: number;
  validator: string;
  plutus_version: string;
  settlements: number;
  total_locked_lovelace: number;
  total_locked_ada: number;
  total_challenger_rewards_lovelace: number;
}
