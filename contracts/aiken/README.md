# shoko — Aiken Smart Contracts

The on-chain **trust layer** for the shoko indexer verification protocol. The
validator turns off-chain consensus outcomes into economically final on-chain
settlement: honest indexers reclaim their stake, dishonest ones are slashed, and
challengers who expose fraud are paid a bounty.

## Layout

```
contracts/aiken/
├── aiken.toml                     # project + stdlib dependency
├── validators/
│   └── claim_validator.ak         # the spend validator
└── lib/shoko/
    ├── types.ak                   # ClaimDatum + Redeemer
    ├── validation.ak              # pure rule helpers
    └── tests.ak                   # unit tests
```

## Model

An indexer locks bonded stake at the script in a UTxO carrying a `ClaimDatum`:

| Field                   | Meaning                                            |
| ----------------------- | -------------------------------------------------- |
| `indexer`               | pubkey hash that owns the stake                    |
| `metric`                | metric being claimed (e.g. `TVL`)                  |
| `claimed_value`         | asserted value                                     |
| `stake`                 | bonded lovelace                                    |
| `challenger_reward_bps` | challenger bounty in basis points of the stake     |
| `deadline`              | POSIX ms after which an unchallenged claim settles |

### Redeemers

- **`FinalizeClaim`** — the indexer reclaims its stake. Requires the indexer's
  signature **and** a transaction validity range that starts at/after
  `deadline` (the challenge window has provably closed).
- **`SlashClaim { challenger }`** — a challenger who proved the claim false
  spends the UTxO. Requires the challenger's signature **and** an output paying
  the challenger at least `stake * challenger_reward_bps / 10000`. The remainder
  of the stake is forfeited by the transaction layout (treasury/burn).

The validator enforces only **authorization** and **economics**. Metric
correctness is decided by the off-chain consensus engine (Koios + Blockfrost);
the chosen redeemer is what the chain makes final.

## Build & test

```bash
aiken check          # run the unit tests in lib/shoko/tests.ak
aiken build          # compile to plutus.json (Plutus V3)
aiken blueprint address --validator claim_validator   # script address
```

The compiled `plutus.json` blueprint is consumed by the Lucid Evolution helpers
in `apps/web/src/blockchain` to build and submit transactions.
