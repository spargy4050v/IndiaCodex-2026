"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/states";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { SlashHistory } from "@/components/slashing/SlashHistory";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { SlashChart } from "@/components/charts/SlashChart";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Gavel, ShieldAlert } from "lucide-react";
import { buildSlashHistory } from "@/lib/series";
import { formatAda } from "@/lib/utils";
import { useShokoStore } from "@/store/useShokoStore";

export default function SlashEventsPage() {
  const { slashEvents, indexers, loading, error, init } = useShokoStore();

  const totalSlashed = slashEvents.reduce((a, e) => a + e.amount_slashed, 0);
  const totalRewards = slashEvents.reduce((a, e) => a + e.challenger_reward, 0);
  const isLoading = loading && !slashEvents.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Slash Events"
        description="Economic penalties applied to indexers caught making false claims."
      />

      {error && !slashEvents.length ? (
        <ErrorState message={error} onRetry={init} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsCard
              label="Slash Events"
              value={slashEvents.length}
              icon={ShieldAlert}
              tone="destructive"
              loading={isLoading}
            />
            <StatsCard
              label="Total Slashed"
              value={formatAda(totalSlashed)}
              icon={Coins}
              tone="destructive"
              loading={isLoading}
            />
            <StatsCard
              label="Challenger Rewards"
              value={formatAda(totalRewards)}
              icon={Gavel}
              tone="success"
              loading={isLoading}
            />
          </div>

          <ChartCard title="Cumulative Slashed" description="Stake burned over time">
            <SlashChart data={buildSlashHistory(slashEvents)} />
          </ChartCard>

          <Card>
            <CardContent className="px-0 pt-0">
              {isLoading ? (
                <TableSkeleton cols={7} />
              ) : (
                <SlashHistory events={slashEvents} indexers={indexers} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
