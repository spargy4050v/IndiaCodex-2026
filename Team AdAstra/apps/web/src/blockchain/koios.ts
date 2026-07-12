// Minimal typed Koios client — a second, independent chain data source used to
// cross-check Blockfrost (mirrors the off-chain consensus design).

import { chainConfig } from "./config";
import type { ChainTip } from "./types";

export class KoiosClient {
  private readonly url: string;

  constructor(url = chainConfig.koios.url) {
    this.url = url.replace(/\/$/, "");
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.url}${path}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Koios ${path} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  }

  /** Current chain tip via Koios. */
  async getTip(): Promise<ChainTip> {
    const rows = await this.get<
      Array<{ epoch_no: number; abs_slot: number; block_no: number; hash: string }>
    >("/tip");
    const tip = rows[0];
    return {
      epoch: tip.epoch_no,
      slot: tip.abs_slot,
      blockHeight: tip.block_no,
      hash: tip.hash,
    };
  }

  /** Address information incl. balance, used to verify locked stake. */
  async getAddressInfo(address: string): Promise<
    Array<{ address: string; balance: string; utxo_set: unknown[] }>
  > {
    return this.postJson("/address_info", { _addresses: [address] });
  }

  private async postJson<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.url}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Koios ${path} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  }
}

export const koios = new KoiosClient();
