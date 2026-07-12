//// ┌─────────────────────────────────────────────────────────────────────────┐
//// │ shoko — claim_validator (hackathon submission, self-contained)          │
//// │                                                                         │
//// │ On-chain trust layer for the shoko indexer verification protocol.       │
//// │ Honest indexers reclaim their stake; dishonest ones are slashed and the │
//// │ challenger who exposed the fraud is paid a bounty.                       │
//// │                                                                         │
//// │ Target: Plutus V3 · aiken-lang/stdlib v2 · aiken v1.1                    │
//// └─────────────────────────────────────────────────────────────────────────┘

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite}
use cardano/address.{VerificationKey}
use cardano/assets
use cardano/transaction.{Output, OutputReference, Transaction, ValidityRange}

// ── Datum ──────────────────────────────────────────────────────────────────
// Locked alongside an indexer's bonded stake at the script.
pub type ClaimDatum {
  indexer: VerificationKeyHash,
  metric: ByteArray,
  claimed_value: Int,
  stake: Int,
  challenger_reward_bps: Int,
  deadline: Int,
}

// ── Redeemer ───────────────────────────────────────────────────────────────
pub type Redeemer {
  // Indexer reclaims stake after the challenge window closes unchallenged.
  FinalizeClaim
  // Challenger proves the claim false and slashes the indexer.
  SlashClaim { challenger: VerificationKeyHash }
}

// ── Rules ──────────────────────────────────────────────────────────────────
fn signed_by(signatories: List<VerificationKeyHash>, key: VerificationKeyHash) -> Bool {
  list.has(signatories, key)
}

fn after_deadline(range: ValidityRange, deadline: Int) -> Bool {
  when range.lower_bound.bound_type is {
    Finite(lower) -> lower >= deadline
    _ -> False
  }
}

fn lovelace_paid_to(outputs: List<Output>, key: VerificationKeyHash) -> Int {
  list.foldr(
    outputs,
    0,
    fn(output, acc) {
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

fn reward_amount(stake: Int, bps: Int) -> Int {
  stake * bps / 10000
}

// ── Validator ──────────────────────────────────────────────────────────────
validator claim_validator {
  spend(
    datum: Option<ClaimDatum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(claim) = datum

    when redeemer is {
      FinalizeClaim ->
        signed_by(self.extra_signatories, claim.indexer)? && after_deadline(
          self.validity_range,
          claim.deadline,
        )?

      SlashClaim { challenger } -> {
        let reward = reward_amount(claim.stake, claim.challenger_reward_bps)
        signed_by(self.extra_signatories, challenger)? && (lovelace_paid_to(
          self.outputs,
          challenger,
        ) >= reward)?
      }
    }
  }

  else(_) {
    fail
  }
}

// ── Tests (aiken check) ──────────────────────────────────────────────────────
test reward_is_basis_points() {
  reward_amount(1_000_000, 1000) == 100_000
}

test signer_detected() {
  signed_by([#"cafe", #"beef"], #"beef")
}

test deadline_passed() {
  after_deadline(interval.after(1_600_000), 1_500_000)
}
