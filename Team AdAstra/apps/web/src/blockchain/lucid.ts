// Lucid Evolution helpers: initialise a provider-backed Lucid instance, resolve
// the validator + its address, and build the three protocol transactions
// (lock stake, finalize claim, slash claim).

import {
  Blockfrost,
  Data,
  Lucid,
  fromText,
  validatorToAddress,
  type LucidEvolution,
  type Script,
  type UTxO,
  type WalletApi,
} from "@lucid-evolution/lucid";
import { chainConfig } from "./config";
import {
  encodeClaimDatum,
  encodeFinalizeRedeemer,
  encodeSlashRedeemer,
} from "./datum";
import type { OnchainClaimDatum } from "./types";

/** Initialise Lucid with the Blockfrost provider and optionally a wallet. */
export async function initLucid(walletApi?: WalletApi): Promise<LucidEvolution> {
  const lucid = await Lucid(
    new Blockfrost(chainConfig.blockfrost.url, chainConfig.blockfrost.projectId),
    chainConfig.network
  );
  if (walletApi) lucid.selectWallet.fromAPI(walletApi);
  return lucid;
}

/** The compiled spend validator (Plutus V3). */
export function getValidator(): Script {
  return { type: "PlutusV3", script: chainConfig.scriptCbor };
}

/** Bech32 address of the validator on the configured network. */
export function getScriptAddress(): string {
  if (chainConfig.scriptAddress) return chainConfig.scriptAddress;
  return validatorToAddress(chainConfig.network, getValidator());
}

const ADA = 1_000_000n;

/** Lock bonded stake at the script with a claim datum. Returns the tx hash. */
export async function lockStake(
  lucid: LucidEvolution,
  datum: OnchainClaimDatum
): Promise<string> {
  const tx = await lucid
    .newTx()
    .pay.ToContract(
      getScriptAddress(),
      { kind: "inline", value: encodeClaimDatum(datum) },
      { lovelace: datum.stake }
    )
    .complete();
  const signed = await tx.sign.withWallet().complete();
  return signed.submit();
}

/** Build (unsigned) the finalize tx: the indexer reclaims stake after deadline. */
export async function buildFinalizeTx(
  lucid: LucidEvolution,
  scriptUtxo: UTxO,
  deadline: number
): Promise<string> {
  const tx = await lucid
    .newTx()
    .collectFrom([scriptUtxo], encodeFinalizeRedeemer())
    .attach.SpendingValidator(getValidator())
    .validFrom(deadline)
    .addSigner(await lucid.wallet().address())
    .complete();
  return tx.toCBOR();
}

/** Build (unsigned) the slash tx: challenger spends the UTxO and takes bounty. */
export async function buildSlashTx(
  lucid: LucidEvolution,
  scriptUtxo: UTxO,
  params: { challenger: string; challengerAddress: string }
): Promise<string> {
  const datum = Data.from(scriptUtxo.datum ?? "", Data.Any);
  void datum; // datum is validated on-chain; decoded here only if needed

  const staked = scriptUtxo.assets.lovelace ?? 0n;
  const reward = (staked * BigInt(chainConfig.challengerRewardBps)) / 10000n;

  const tx = await lucid
    .newTx()
    .collectFrom([scriptUtxo], encodeSlashRedeemer(params.challenger))
    .attach.SpendingValidator(getValidator())
    .pay.ToAddress(params.challengerAddress, { lovelace: reward < ADA ? ADA : reward })
    .addSigner(params.challengerAddress)
    .complete();
  return tx.toCBOR();
}

export { fromText };
