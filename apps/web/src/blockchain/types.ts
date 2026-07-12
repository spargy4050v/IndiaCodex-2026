// Shared types for the shoko blockchain layer.

export interface OnchainClaimDatum {
  indexer: string; // pubkey hash (hex)
  metric: string; // utf-8
  claimedValue: bigint;
  stake: bigint; // lovelace
  challengerRewardBps: bigint;
  deadline: bigint; // POSIX ms
}

export interface SubmitClaimParams {
  metric: string;
  claimedValue: number | bigint;
  stakeAda: number; // ADA to bond
  challengerRewardBps?: number;
}

export interface ChallengeParams {
  claimTxHash: string;
  claimOutputIndex: number;
  challengerAddress: string;
  reason?: string;
}

export interface SlashParams {
  claimTxHash: string;
  claimOutputIndex: number;
  challenger: string; // pubkey hash (hex)
  challengerAddress: string; // bech32 payout address
}

export interface TxResult {
  txHash: string;
  network: string;
  explorerUrl: string;
}

export interface UnsignedTx {
  cbor: string;
  description: string;
}

export interface ChainTip {
  epoch: number;
  slot: number;
  blockHeight: number;
  hash: string;
}

export interface ChainState {
  tip: ChainTip;
  scriptAddress: string;
  lockedUtxos: number;
  totalLockedLovelace: bigint;
}
