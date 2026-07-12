//// Core on-chain data types for the shoko claim validator.
////
//// A locked UTxO represents an indexer's bonded stake tied to a single metric
//// claim. The datum captures everything the validator needs to later either
//// return the stake (claim held up) or slash it and pay a challenger.

use aiken/crypto.{VerificationKeyHash}

/// Datum locked alongside an indexer's staked ADA.
pub type ClaimDatum {
  /// Public-key hash of the indexer that bonded the stake.
  indexer: VerificationKeyHash,
  /// Metric being claimed, e.g. "TVL" (utf-8 bytes).
  metric: ByteArray,
  /// The value the indexer asserts for the metric.
  claimed_value: Int,
  /// Bonded stake in lovelace.
  stake: Int,
  /// Challenger bounty as basis points of the stake (0..10000).
  challenger_reward_bps: Int,
  /// POSIX time (ms) after which an unchallenged claim can be finalized.
  deadline: Int,
}

/// Actions that can spend a locked claim UTxO.
pub type Redeemer {
  /// Indexer reclaims stake once the challenge window has closed unchallenged.
  FinalizeClaim
  /// A challenger proves the claim false and slashes the indexer.
  SlashClaim { challenger: VerificationKeyHash }
}
