// Minimal typed Blockfrost REST client (query + submit). Uses fetch so it has
// no runtime dependency beyond the platform.

import { chainConfig } from "./config";
import type { ChainTip } from "./types";

export class BlockfrostClient {
  private readonly url: string;
  private readonly projectId: string;

  constructor(url = chainConfig.blockfrost.url, projectId = chainConfig.blockfrost.projectId) {
    this.url = url.replace(/\/$/, "");
    this.projectId = projectId;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.url}${path}`, {
      headers: { project_id: this.projectId },
    });
    if (!res.ok) {
      throw new Error(`Blockfrost ${path} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  }

  /** Latest block → chain tip. */
  async getTip(): Promise<ChainTip> {
    const block = await this.get<{
      epoch: number;
      slot: number;
      height: number;
      hash: string;
    }>("/blocks/latest");
    return {
      epoch: block.epoch,
      slot: block.slot,
      blockHeight: block.height,
      hash: block.hash,
    };
  }

  /** UTxOs sitting at a script/address. */
  async getAddressUtxos(address: string): Promise<
    Array<{
      tx_hash: string;
      output_index: number;
      amount: Array<{ unit: string; quantity: string }>;
      data_hash: string | null;
      inline_datum: string | null;
    }>
  > {
    return this.get(`/addresses/${address}/utxos`);
  }

  /** Submit a signed transaction (CBOR hex) to the network. */
  async submitTx(txCbor: string): Promise<string> {
    const res = await fetch(`${this.url}/tx/submit`, {
      method: "POST",
      headers: {
        project_id: this.projectId,
        "Content-Type": "application/cbor",
      },
      body: Buffer.from(txCbor, "hex"),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Blockfrost tx submit failed: ${res.status} ${detail}`);
    }
    return (await res.json()) as string; // tx hash
  }
}

export const blockfrost = new BlockfrostClient();
