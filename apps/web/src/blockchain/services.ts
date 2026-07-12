// High-level blockchain services used by the app. Each method combines the
// providers (Blockfrost/Koios), Lucid Evolution tx building, and the shoko
// backend (off-chain adjudication) into one protocol action.

import axios from "axios";
import type { LucidEvolution, UTxO, WalletApi } from "@lucid-evolution/lucid";
import { chainConfig } from "./config";
import { blockfrost } from "./blockfrost";
import { koios } from "./koios";
import {
  buildFinalizeTx,
  buildSlashTx,
  getScriptAddress,
  initLucid,
  lockStake,
} from "./lucid";
import { decodeClaimDatum } from "./datum";
import { fromText } from "@lucid-evolution/lucid";
import type {
  ChainState,
  OnchainClaimDatum,
  SlashParams,
  SubmitClaimParams,
  TxResult,
  UnsignedTx,
} from "./types";

const ADA = 1_000_000n;

function explorerUrl(txHash: string): string {
  const sub = chainConfig.network === "Mainnet" ? "" : `${chainConfig.network.toLowerCase()}.`;
  return `https://${sub}cardanoscan.io/transaction/${txHash}`;
}

export class OnchainService {
  private readonly api = axios.create({ baseURL: `${chainConfig.apiUrl}/api` });

  /** Lock stake + a claim datum at the validator. */
  async submitClaim(params: SubmitClaimParams, walletApi: WalletApi): Promise<TxResult> {
    const lucid = await initLucid(walletApi);
    const indexer = await this.paymentKeyHash(lucid);

    const datum: OnchainClaimDatum = {
      indexer,
      metric: fromText(params.metric),
      claimedValue: BigInt(params.claimedValue),
      stake: BigInt(params.stakeAda) * ADA,
      challengerRewardBps: BigInt(params.challengerRewardBps ?? chainConfig.challengerRewardBps),
      deadline: BigInt(Date.now() + chainConfig.challengeWindowMs),
    };

    const txHash = await lockStake(lucid, datum);
    return { txHash, network: chainConfig.network, explorerUrl: explorerUrl(txHash) };
  }

  /** Read chain tip + the stake currently locked at the validator. */
  async queryChainState(): Promise<ChainState> {
    const scriptAddress = getScriptAddress();
    const [tip, utxos] = await Promise.all([
      blockfrost.getTip(),
      blockfrost.getAddressUtxos(scriptAddress).catch(() => []),
    ]);

    const totalLockedLovelace = utxos.reduce((acc, u) => {
      const ada = u.amount.find((a) => a.unit === "lovelace");
      return acc + BigInt(ada?.quantity ?? "0");
    }, 0n);

    return {
      tip,
      scriptAddress,
      lockedUtxos: utxos.length,
      totalLockedLovelace,
    };
  }

  /** Second-source confirmation of the chain tip via Koios. */
  async confirmTip(): Promise<{ blockfrost: number; koios: number; agree: boolean }> {
    const [bf, ko] = await Promise.all([blockfrost.getTip(), koios.getTip()]);
    return {
      blockfrost: bf.blockHeight,
      koios: ko.blockHeight,
      agree: Math.abs(bf.blockHeight - ko.blockHeight) <= 1,
    };
  }

  /**
   * Off-chain adjudication: ask the shoko backend to verify a claim against
   * canonical consensus data. The verdict drives which on-chain redeemer is used.
   */
  async verifyClaim(claimId: string): Promise<{ status: "VERIFIED" | "INVALID"; deviation: number }> {
    const { data } = await this.api.post("/verify", { claim_id: claimId });
    return { status: data.verification.status, deviation: data.verification.deviation };
  }

  /**
   * Build a challenge transaction. A challenge that the backend upholds resolves
   * to a slash spend of the claim UTxO; we return the unsigned tx for the
   * challenger's wallet to sign.
   */
  async buildChallengeTx(
    claimId: string,
    challengerId: string,
    slash: SlashParams,
    walletApi: WalletApi
  ): Promise<UnsignedTx> {
    const { data } = await this.api.post("/challenge", {
      claim_id: claimId,
      challenger_id: challengerId,
    });
    if (data.challenge.outcome !== "UPHELD") {
      throw new Error("Challenge rejected off-chain — claim is valid, no slash tx built.");
    }
    return this.buildSlashingTx(slash, walletApi);
  }

  /** Build the SlashClaim transaction paying the challenger their bounty. */
  async buildSlashingTx(params: SlashParams, walletApi: WalletApi): Promise<UnsignedTx> {
    const lucid = await initLucid(walletApi);
    const utxo = await this.findScriptUtxo(params.claimTxHash, params.claimOutputIndex);
    const cbor = await buildSlashTx(lucid, utxo, {
      challenger: params.challenger,
      challengerAddress: params.challengerAddress,
    });
    return { cbor, description: `Slash claim ${params.claimTxHash}#${params.claimOutputIndex}` };
  }

  /** Build the FinalizeClaim transaction reclaiming stake after the deadline. */
  async buildFinalizeTx(
    claimTxHash: string,
    claimOutputIndex: number,
    walletApi: WalletApi
  ): Promise<UnsignedTx> {
    const lucid = await initLucid(walletApi);
    const utxo = await this.findScriptUtxo(claimTxHash, claimOutputIndex);
    const datum = decodeClaimDatum(utxo.datum ?? "");
    const cbor = await buildFinalizeTx(lucid, utxo, Number(datum.deadline));
    return { cbor, description: `Finalize claim ${claimTxHash}#${claimOutputIndex}` };
  }

  private async findScriptUtxo(txHash: string, index: number): Promise<UTxO> {
    const lucid = await initLucid();
    const utxos = await lucid.utxosAt(getScriptAddress());
    const match = utxos.find((u) => u.txHash === txHash && u.outputIndex === index);
    if (!match) throw new Error(`Script UTxO ${txHash}#${index} not found.`);
    return match;
  }

  private async paymentKeyHash(lucid: LucidEvolution): Promise<string> {
    const address = await lucid.wallet().address();
    const { paymentCredentialOf } = await import("@lucid-evolution/lucid");
    return paymentCredentialOf(address).hash;
  }
}

export const onchainService = new OnchainService();
