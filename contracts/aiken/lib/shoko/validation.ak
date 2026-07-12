//// Pure validation helpers for the shoko claim validator.
////
//// Each function encodes one protocol rule and returns a Bool, so the
//// validator reads as a checklist and every rule is independently testable.

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite}
use cardano/address.{Address, VerificationKey}
use cardano/assets
use cardano/transaction.{Output, ValidityRange}

/// True if `key` is present in the transaction's required signers.
pub fn signed_by(signatories: List<VerificationKeyHash>, key: VerificationKeyHash) -> Bool {
  list.has(signatories, key)
}

/// True if the transaction's validity range starts at or after `deadline`,
/// i.e. the challenge window has provably elapsed.
pub fn after_deadline(range: ValidityRange, deadline: Int) -> Bool {
  when range.lower_bound.bound_type is {
    Finite(lower) -> lower >= deadline
    _ -> False
  }
}

/// Total lovelace paid to outputs locked by `key`'s payment credential.
pub fn lovelace_paid_to(outputs: List<Output>, key: VerificationKeyHash) -> Int {
  list.foldr(
    outputs,
    0,
    fn(output: Output, acc: Int) {
      when output.address.payment_credential is {
        VerificationKey(vkh) ->
          if vkh == key {
            acc + assets.lovelace_of(output.value)
          } else {
            acc
          }
        _ -> acc
      }
    },
  )
}

/// The challenger must receive at least the bounty owed on a slash.
pub fn challenger_paid(outputs: List<Output>, challenger: VerificationKeyHash, reward: Int) -> Bool {
  lovelace_paid_to(outputs, challenger) >= reward
}

/// Basis-points bounty owed to a challenger for a stake of `stake` lovelace.
pub fn reward_amount(stake: Int, bps: Int) -> Int {
  stake * bps / 10000
}

/// Guard: an address must be a plain payment-key address (used off-chain
/// when building payout outputs).
pub fn is_pubkey_address(address: Address, key: VerificationKeyHash) -> Bool {
  when address.payment_credential is {
    VerificationKey(vkh) -> vkh == key
    _ -> False
  }
}
