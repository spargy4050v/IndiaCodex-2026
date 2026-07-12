//// Unit tests for the shoko validation rules.
//// Run with `aiken check`.

use aiken/interval
use cardano/address.{Address, Inline, VerificationKey}
use cardano/assets
use cardano/transaction.{NoDatum, Output}
use shoko/validation

fn payout(key: ByteArray, lovelace: Int) -> Output {
  Output {
    address: Address {
      payment_credential: VerificationKey(key),
      stake_credential: None,
    },
    value: assets.from_lovelace(lovelace),
    datum: NoDatum,
    reference_script: None,
  }
}

test reward_is_basis_points() {
  // 10% of 1_000_000 = 100_000
  validation.reward_amount(1_000_000, 1000) == 100_000
}

test signed_by_detects_signer() {
  validation.signed_by([#"cafe", #"beef"], #"beef")
}

test signed_by_rejects_absent() {
  !validation.signed_by([#"cafe"], #"beef")
}

test after_deadline_true_when_window_passed() {
  validation.after_deadline(interval.after(1_600_000), 1_500_000)
}

test after_deadline_false_before_window() {
  !validation.after_deadline(interval.after(1_400_000), 1_500_000)
}

test challenger_paid_enough() {
  let outputs = [payout(#"beef", 60_000), payout(#"cafe", 10_000)]
  validation.challenger_paid(outputs, #"beef", 50_000)
}

test challenger_underpaid_fails() {
  let outputs = [payout(#"beef", 40_000)]
  !validation.challenger_paid(outputs, #"beef", 50_000)
}
