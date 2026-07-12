# Deployment — shoko `claim_validator`

End-to-end steps to build, address, and operate the validator on Cardano
**Preprod** testnet.

## 1. Prerequisites

```bash
# Aiken (compiler)
curl -sSfL https://install.aiken-lang.org | bash
aiken --version        # v1.1.x

# A Blockfrost Preprod project id → https://blockfrost.io
export BLOCKFROST_PROJECT_ID=preprod...
```

## 2. Build the validator

```bash
cd contracts/aiken
aiken check            # unit tests pass
aiken build            # produces plutus.json (Plutus V3 blueprint)
```

`plutus.json` contains the `claim_validator` `compiledCode` (CBOR hex) — this is
the value the off-chain layer needs.

## 3. Derive the script address

```bash
aiken blueprint address --validator claim_validator
# addr_test1w... (Preprod)
```

## 4. Wire the off-chain layer

Copy the compiled CBOR + address into the web app's environment
(`apps/web/.env.local`):

```bash
NEXT_PUBLIC_CARDANO_NETWORK=Preprod
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=preprod...
NEXT_PUBLIC_SHOKO_SCRIPT_CBOR=<compiledCode from plutus.json>
NEXT_PUBLIC_SHOKO_SCRIPT_ADDRESS=addr_test1w...
```

The backend anchor (`blockchain/onchain.py`) reads the same address via
`SHOKO_SCRIPT_ADDRESS` / `CARDANO_NETWORK`.

## 5. Protocol transactions (Lucid Evolution + Mesh)

Implemented in [`apps/web/src/blockchain`](../apps/web/src/blockchain):

| Action        | Builder                              | Redeemer                    |
| ------------- | ------------------------------------ | --------------------------- |
| Lock stake    | `onchainService.submitClaim(...)`    | — (produces `ClaimDatum`)   |
| Finalize      | `onchainService.buildFinalizeTx(...)`| `FinalizeClaim`             |
| Challenge     | `onchainService.buildChallengeTx(...)`| `SlashClaim` (if upheld)   |
| Slash         | `onchainService.buildSlashingTx(...)`| `SlashClaim { challenger }` |

Wallets are connected through Mesh SDK (`walletService`), and the CIP-30 API is
handed to Lucid Evolution to sign and submit via Blockfrost.

### Example flow

```ts
import { walletService, onchainService } from "@/blockchain";

await walletService.connect("eternl");
const api = await walletService.getCip30Api();

// 1) Indexer locks 100 ADA behind a TVL claim
await onchainService.submitClaim(
  { metric: "TVL", claimedValue: 1_250_000_000, stakeAda: 100 },
  api
);

// 2) A challenger disputes it → backend adjudicates → slash tx if upheld
const tx = await onchainService.buildChallengeTx(
  "clm_123",
  "idx_watcher05",
  { claimTxHash, claimOutputIndex: 0, challenger: challengerKeyHash, challengerAddress },
  api
);
await walletService.signAndSubmit(tx.cbor);
```

## 6. Verify on-chain settlement

- Explorer: `https://preprod.cardanoscan.io/transaction/<txHash>`
- Backend anchor view: `GET /api/onchain/settlements` and `GET /api/onchain/script`
  show the datum, redeemer, and tx reference for every protocol outcome.

## Security notes (MVP scope)

- The validator enforces authorization + payout economics; **claim correctness is
  adjudicated off-chain** by the consensus engine.
- A production version would add: a challenge bond + on-chain challenge UTxO, an
  oracle/threshold-sig attestation of the consensus verdict, and a treasury
  address for the forfeited (non-bounty) portion of slashed stake.
