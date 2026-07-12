"use client";

import { Coins, Gavel, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/states";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { SlashHistory } from "@/components/slashing/SlashHistory";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { SlashChart } from "@/components/charts/SlashChart";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/motion";
import { buildSlashHistory } from "@/lib/series";
import { formatAda } from "@/lib/utils";
import { useShokoStore } from "@/store/useShokoStore";

export default function SlashEventsPage() {
  const { slashEvents, indexers, settlements, loading, error, init } = useShokoStore();

  const totalSlashed = slashEvents.reduce((a, e) => a + e.amount_slashed, 0);
  const totalRewards = slashEvents.reduce((a, e) => a + e.challenger_reward, 0);
  const isLoading = loading && !slashEvents.length;

  return (
    <>
      <PageHeader
        title="Slash Events"
        description="Economic penalties applied to indexers caught making false claims."
      />

      {error && !slashEvents.length ? (
        <ErrorState message={error} onRetry={init} />
      ) : (
        <>
          <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <RevealItem>
              <StatsCard
                label="Slash Events"
                count={slashEvents.length}
                icon={ShieldAlert}
                tone="destructive"
                loading={isLoading}
              />
            </RevealItem>
            <RevealItem>
              <StatsCard
                label="Total Slashed"
                count={totalSlashed}
                format={(n) => formatAda(n)}
                icon={Coins}
                tone="destructive"
                loading={isLoading}
              />
            </RevealItem>
            <RevealItem>
              <StatsCard
                label="Challenger Rewards"
                count={totalRewards}
                format={(n) => formatAda(n)}
                icon={Gavel}
                tone="success"
                loading={isLoading}
              />
            </RevealItem>
          </RevealGroup>

          <Reveal delay={0.05}>
            <ChartCard title="Cumulative Slashed" description="Stake burned over time">
              <SlashChart data={buildSlashHistory(slashEvents)} />
            </ChartCard>
          </Reveal>

          <Reveal delay={0.05}>
            <Card>
              <CardContent className="px-0 pt-0">
                {isLoading ? (
                  <TableSkeleton cols={8} />
                ) : (
                  <SlashHistory
                    events={slashEvents}
                    indexers={indexers}
                    settlements={settlements}
                  />
                )}
              </CardContent>
            </Card>
          </Reveal>
        </>
      )}
    </>
  );
}
