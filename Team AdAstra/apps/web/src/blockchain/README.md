# shoko blockchain layer

Client-side Cardano integration that turns protocol actions into on-chain
transactions against the Aiken `claim_validator`.

```
src/blockchain/
├── config.ts        # network + Blockfrost/Koios + script params (env-driven)
├── types.ts         # shared TS types
├── blockfrost.ts    # Blockfrost REST client (query + submit)
├── koios.ts         # Koios client (second data source)
├── datum.ts         # Plutus Data encoders mirroring the Aiken types
├── lucid.ts         # Lucid Evolution: init, script address, tx builders
├── wallet.ts        # Mesh SDK CIP-30 wallet (connect/sign/submit/address)
├── services.ts      # OnchainService: submit / query / verify / challenge / slash
└── index.ts         # barrel
```

## Usage

This layer depends on `@lucid-evolution/lucid` and `@meshsdk/core` (declared in
`package.json`, installed via `npm install`). It is client-only — import it from
a client component and drive it with a connected wallet:

```ts
"use client";
import { walletService, onchainService } from "@/blockchain";

await walletService.connect("eternl");
const api = await walletService.getCip30Api();

// Lock stake + claim on-chain
await onchainService.submitClaim(
  { metric: "TVL", claimedValue: 1_250_000_000, stakeAda: 100 },
  api
);

// Challenge → slash (bounty paid to challenger)
const tx = await onchainService.buildChallengeTx("clm_123", "idx_watcher05", {
  claimTxHash, claimOutputIndex: 0,
  challenger: challengerKeyHash, challengerAddress,
}, api);
await walletService.signAndSubmit(tx.cbor);
```

## Configuration

Set the `NEXT_PUBLIC_*` chain vars in `.env.local` (see `.env.example`). The
`NEXT_PUBLIC_SHOKO_SCRIPT_CBOR` / `_ADDRESS` come from `aiken build` +
`aiken blueprint address` in `contracts/aiken`.
