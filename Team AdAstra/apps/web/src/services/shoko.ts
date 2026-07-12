import { api } from "@/lib/api";
import type {
  ChainSettlement,
  ChainSnapshot,
  Challenge,
  ChallengeResponse,
  Claim,
  ClaimStatus,
  CreateClaimPayload,
  DashboardResponse,
  IndexerView,
  Metric,
  NetworkHealth,
  ScriptInfo,
  SlashEvent,
  VerifyResponse,
} from "@/types";

export const shokoApi = {
  async getDashboard(): Promise<DashboardResponse> {
    const { data } = await api.get<DashboardResponse>("/dashboard");
    return data;
  },

  async getNetworkHealth(): Promise<NetworkHealth> {
    const { data } = await api.get<NetworkHealth>("/network-health");
    return data;
  },

  async getClaims(params?: {
    status?: ClaimStatus;
    metric?: Metric;
    indexer_id?: string;
  }): Promise<Claim[]> {
    const { data } = await api.get<Claim[]>("/claims", { params });
    return data;
  },

  async createClaim(payload: CreateClaimPayload): Promise<VerifyResponse | Claim> {
    const { data } = await api.post<VerifyResponse | Claim>("/claims", payload);
    return data;
  },

  async verifyClaim(claimId: string): Promise<VerifyResponse> {
    const { data } = await api.post<VerifyResponse>("/verify", {
      claim_id: claimId,
    });
    return data;
  },

  async challengeClaim(
    claimId: string,
    challengerId: string,
    reason = ""
  ): Promise<ChallengeResponse> {
    const { data } = await api.post<ChallengeResponse>("/challenge", {
      claim_id: claimId,
      challenger_id: challengerId,
      reason,
    });
    return data;
  },

  async getIndexers(): Promise<IndexerView[]> {
    const { data } = await api.get<IndexerView[]>("/indexers");
    return data;
  },

  async getSlashEvents(indexerId?: string): Promise<SlashEvent[]> {
    const { data } = await api.get<SlashEvent[]>("/slash-events", {
      params: indexerId ? { indexer_id: indexerId } : undefined,
    });
    return data;
  },

  async getChain(): Promise<ChainSnapshot> {
    const { data } = await api.get<ChainSnapshot>("/chain");
    return data;
  },

  async getSettlements(claimId?: string): Promise<ChainSettlement[]> {
    const { data } = await api.get<ChainSettlement[]>("/onchain/settlements", {
      params: claimId ? { claim_id: claimId } : undefined,
    });
    return data;
  },

  async getScriptInfo(): Promise<ScriptInfo> {
    const { data } = await api.get<ScriptInfo>("/onchain/script");
    return data;
  },
};

export type { Challenge };
