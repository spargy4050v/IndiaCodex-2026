import { create } from "zustand";
import { apiError } from "@/lib/api";
import { shokoApi } from "@/services/shoko";
import type {
  Claim,
  DashboardResponse,
  IndexerView,
  SlashEvent,
} from "@/types";

interface ShokoState {
  dashboard: DashboardResponse | null;
  claims: Claim[];
  indexers: IndexerView[];
  slashEvents: SlashEvent[];

  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: number | null;

  /** Full initial load (shows the skeleton). */
  init: () => Promise<void>;
  /** Silent refresh used by polling and after mutations. */
  refresh: () => Promise<void>;
}

async function loadAll() {
  const [dashboard, claims, indexers, slashEvents] = await Promise.all([
    shokoApi.getDashboard(),
    shokoApi.getClaims(),
    shokoApi.getIndexers(),
    shokoApi.getSlashEvents(),
  ]);
  return { dashboard, claims, indexers, slashEvents };
}

export const useShokoStore = create<ShokoState>((set) => ({
  dashboard: null,
  claims: [],
  indexers: [],
  slashEvents: [],
  loading: true,
  refreshing: false,
  error: null,
  lastUpdated: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      const data = await loadAll();
      set({ ...data, loading: false, lastUpdated: Date.now() });
    } catch (e) {
      set({ loading: false, error: apiError(e) });
    }
  },

  refresh: async () => {
    set({ refreshing: true });
    try {
      const data = await loadAll();
      set({ ...data, refreshing: false, error: null, lastUpdated: Date.now() });
    } catch (e) {
      set({ refreshing: false, error: apiError(e) });
    }
  },
}));
