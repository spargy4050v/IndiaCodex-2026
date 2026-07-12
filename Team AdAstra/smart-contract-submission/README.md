# shoko — Smart Contract Submission

**Project:** shoko — a decentralized indexer verification protocol for Cardano.
**Validator:** `claim_validator` (Plutus V3, written in Aiken).

Indexers stake ADA to back their on-chain metric claims (TVL, DRep votes,
transactions, epoch, …). The validator is the **trust layer** that makes the
protocol's verdicts economically final:

```
Indexer → Claim → Verification → Consensus → Challenge → Slashing → Verified
```

## What the validator does

An indexer locks bonded stake at the script in a UTxO carrying a `ClaimDatum`.
That UTxO can be spent in exactly two ways:

| Redeemer                     | Who        | On-chain checks                                                                 |
| ---------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `FinalizeClaim`              | Indexer    | signed by `indexer` **and** tx validity starts ≥ `deadline` (window closed)     |
| `SlashClaim { challenger }`  | Challenger | signed by `challenger` **and** challenger paid ≥ `stake × reward_bps / 10000`   |

Anything else (`mint`, `withdraw`, `publish`, `vote`, or a missing datum) fails.

### `ClaimDatum`

| Field                   | Meaning                                            |
| ----------------------- | -------------------------------------------------- |
| `indexer`               | pubkey hash that bonded the stake                  |
| `metric`                | metric being claimed (utf-8 bytes)                 |
| `claimed_value`         | asserted value                                     |
| `stake`                 | bonded lovelace                                    |
| `challenger_reward_bps` | challenger bounty in basis points (e.g. 5000 = 50%)|
| `deadline`              | POSIX ms after which an unchallenged claim settles |

The validator enforces **authorization + economics** only. Metric correctness is
adjudicated off-chain by a Koios + Blockfrost consensus engine; the resulting
redeemer is what the chain settles.

## Files

- [`shoko-claim-validator.ak`](./shoko-claim-validator.ak) — the complete,
  self-contained validator with inline tests.
- [`deployment.md`](./deployment.md) — build, address, and deployment steps.

The full Aiken project (modular form + stdlib dependency) lives in
[`contracts/aiken`](../contracts/aiken).

## Verify locally

```bash
cd contracts/aiken
aiken check     # runs the unit tests
aiken build     # emits plutus.json (Plutus V3 blueprint)
```

## Tech stack

Aiken · Lucid Evolution · Mesh SDK · Blockfrost API · Koios API.
