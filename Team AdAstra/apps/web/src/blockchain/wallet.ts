// Wallet integration via Mesh SDK: connect a CIP-30 browser wallet, read the
// address, sign and submit transactions. Also exposes the raw CIP-30 API so
// Lucid Evolution can drive the same wallet.

import { BrowserWallet, type Wallet } from "@meshsdk/core";
import type { WalletApi } from "@lucid-evolution/lucid";

export class WalletService {
  private wallet: BrowserWallet | null = null;

  /** List installed CIP-30 wallets (Nami, Eternl, Lace, ...). */
  static available(): Wallet[] {
    return BrowserWallet.getInstalledWallets();
  }

  /** Connect a wallet by its CIP-30 id (e.g. "eternl", "lace"). */
  async connect(walletId: string): Promise<void> {
    this.wallet = await BrowserWallet.enable(walletId);
  }

  get connected(): boolean {
    return this.wallet !== null;
  }

  private ensure(): BrowserWallet {
    if (!this.wallet) throw new Error("Wallet not connected. Call connect() first.");
    return this.wallet;
  }

  /** Primary change address (bech32). */
  async getAddress(): Promise<string> {
    return this.ensure().getChangeAddress();
  }

  async getUsedAddresses(): Promise<string[]> {
    return this.ensure().getUsedAddresses();
  }

  /** Lovelace balance across the wallet. */
  async getLovelace(): Promise<bigint> {
    const balance = await this.ensure().getBalance();
    const ada = balance.find((a) => a.unit === "lovelace");
    return BigInt(ada?.quantity ?? "0");
  }

  /** Sign a transaction (CBOR hex). `partialSign` for multi-sig flows. */
  async signTx(txCbor: string, partialSign = false): Promise<string> {
    return this.ensure().signTx(txCbor, partialSign);
  }

  /** Submit a signed transaction, returns the tx hash. */
  async submitTx(signedTxCbor: string): Promise<string> {
    return this.ensure().submitTx(signedTxCbor);
  }

  /** Sign then submit in one step. */
  async signAndSubmit(txCbor: string): Promise<string> {
    const signed = await this.signTx(txCbor);
    return this.submitTx(signed);
  }

  /**
   * The underlying CIP-30 API, so Lucid Evolution can select the same wallet:
   *   lucid.selectWallet.fromAPI(await walletService.getCip30Api());
   */
  async getCip30Api(): Promise<WalletApi> {
    return this.ensure()._walletInstance as unknown as WalletApi;
  }
}

export const walletService = new WalletService();
