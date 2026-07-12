"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/states";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { IndexerLeaderboard } from "@/components/indexers/IndexerLeaderboard";
import { ChartCard } from "@/components/charts/ChartCard";
import { IndexerHealthChart } from "@/components/charts/IndexerHealthChart";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { buildIndexerHealth } from "@/lib/series";
import { formatAda } from "@/lib/utils";
import { useShokoStore } from "@/store/useShokoStore";

export default function IndexersPage() {
  const { indexers, loading, error, init } = useShokoStore();

  const totalStake = indexers.reduce((a, i) => a + i.stake, 0);
  const avgRep =
    indexers.length > 0
      ? indexers.reduce((a, i) => a + i.reputation, 0) / indexers.length
      : 0;
  const slashed = indexers.filter((i) => i.slashed_amount > 0).length;
  const isLoading = loading && !indexers.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indexers"
        description="Staked nodes competing on reputation and accuracy."
      />

      {error && !indexers.length ? (
        <ErrorState message={error} onRetry={init} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard label="Indexers" value={indexers.length} icon={Users} loading={isLoading} />
            <StatsCard
              label="Total Stake"
              value={formatAda(totalStake)}
              icon={Coins}
              tone="success"
              loading={isLoading}
            />
            <StatsCard
              label="Avg Reputation"
              value={avgRep.toFixed(1)}
              icon={TrendingUp}
              tone="warning"
              loading={isLoading}
            />
            <StatsCard
              label="Slashed"
              value={slashed}
              icon={ShieldAlert}
              tone="destructive"
              loading={isLoading}
            />
          </div>

          <ChartCard title="Reputation vs. Accuracy" description="Per-indexer health">
            <IndexerHealthChart data={buildIndexerHealth(indexers)} />
          </ChartCard>

          <Card>
            <CardContent className="px-0 pt-0">
              {isLoading ? (
                <TableSkeleton cols={8} />
              ) : (
                <IndexerLeaderboard indexers={indexers} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
