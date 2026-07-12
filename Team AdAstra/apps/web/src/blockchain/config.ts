// Blockchain layer configuration. All values come from NEXT_PUBLIC_* env vars
// so the chain layer runs client-side with the user's wallet.

export type Network = "Mainnet" | "Preprod" | "Preview";

export const chainConfig = {
  network: (process.env.NEXT_PUBLIC_CARDANO_NETWORK as Network) || "Preprod",

  blockfrost: {
    projectId: process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID || "",
    url:
      process.env.NEXT_PUBLIC_BLOCKFROST_URL ||
      "https://cardano-preprod.blockfrost.io/api/v0",
  },

  koios: {
    url: process.env.NEXT_PUBLIC_KOIOS_URL || "https://preprod.koios.rest/api/v1",
  },

  // Compiled validator CBOR (from `aiken build` → plutus.json). When empty the
  // helpers still type-check; a real deployment injects it here.
  scriptCbor: process.env.NEXT_PUBLIC_SHOKO_SCRIPT_CBOR || "",

  // Pre-computed script address (from `aiken blueprint address`), optional.
  scriptAddress: process.env.NEXT_PUBLIC_SHOKO_SCRIPT_ADDRESS || "",

  // shoko backend (protocol API) used for off-chain adjudication.
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, ""),

  // Default economic parameters mirrored from the backend settings.
  challengerRewardBps: 5000, // 50%
  challengeWindowMs: 1000 * 60 * 60 * 6, // 6h
} as const;

export function assertConfigured(): void {
  if (!chainConfig.blockfrost.projectId) {
    throw new Error(
      "NEXT_PUBLIC_BLOCKFROST_PROJECT_ID is not set — required for chain access."
    );
  }
  if (!chainConfig.scriptCbor) {
    throw new Error(
      "NEXT_PUBLIC_SHOKO_SCRIPT_CBOR is not set — run `aiken build` and inject the validator CBOR."
    );
  }
}
