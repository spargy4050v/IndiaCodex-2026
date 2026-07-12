//// shoko claim validator
////
//// The on-chain trust layer for indexer claim verification and slashing.
////
//// Lifecycle:
////   1. Register / Submit  — an indexer locks stake at this script with a
////      `ClaimDatum` (built off-chain by the Lucid/Mesh services).
////   2. FinalizeClaim      — after the challenge window closes with no valid
////      challenge, the indexer reclaims its stake (must sign, deadline passed).
////   3. SlashClaim         — a challenger who proves the claim false spends the
////      UTxO, is required to sign, and must be paid the bounty; the remaining
////      stake is burned/forfeited to the treasury by the tx layout.
////
//// The validator only enforces the economic + authorization rules. Metric
//// correctness is adjudicated by the consensus layer off-chain; the resulting
//// redeemer choice is what the chain settles.

use cardano/transaction.{OutputReference, Transaction}
use shoko/types.{ClaimDatum, FinalizeClaim, Redeemer, SlashClaim}
use shoko/validation

validator claim_validator {
  spend(
    datum: Option<ClaimDatum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(claim) = datum

    when redeemer is {
      // The indexer withdraws its stake once the window has elapsed unchallenged.
      FinalizeClaim ->
        validation.signed_by(self.extra_signatories, claim.indexer)? && validation.after_deadline(
          self.validity_range,
          claim.deadline,
        )?

      // A challenger slashes a proven-false claim and collects the bounty.
      SlashClaim { challenger } -> {
        let reward =
          validation.reward_amount(claim.stake, claim.challenger_reward_bps)
        validation.signed_by(self.extra_signatories, challenger)? && validation.challenger_paid(
          self.outputs,
          challenger,
          reward,
        )?
      }
    }
  }

  // Any other script purpose (mint, withdraw, publish, vote) is unsupported.
  else(_) {
    fail
  }
}
