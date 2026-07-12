"use client";

import { useMemo } from "react";
import { Coins, LayoutList, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/states";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { IndexerLeaderboard } from "@/components/indexers/IndexerLeaderboard";
import { IndexerCard } from "@/components/indexers/IndexerCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAda } from "@/lib/utils";
import { useShokoStore } from "@/store/useShokoStore";

export default function IndexersPage() {
  const { indexers, claims, loading, error, init } = useShokoStore();

  const totalStake = indexers.reduce((a, i) => a + i.stake, 0);
  const avgRep =
    indexers.length > 0
      ? indexers.reduce((a, i) => a + i.reputation, 0) / indexers.length
      : 0;
  const slashed = indexers.filter((i) => i.slashed_amount > 0).length;
  const isLoading = loading && !indexers.length;

  // Last activity per indexer, derived from their most recent claim.
  const lastActivity = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of claims) {
      const prev = map[c.indexer_id];
      if (!prev || new Date(c.timestamp) > new Date(prev)) map[c.indexer_id] = c.timestamp;
    }
    return map;
  }, [claims]);

  return (
    <>
      <PageHeader
        title="Indexers"
        description="Staked nodes competing on reputation and accuracy."
      />

      {error && !indexers.length ? (
        <ErrorState message={error} onRetry={init} />
      ) : (
        <>
          <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <RevealItem>
              <StatsCard label="Indexers" count={indexers.length} icon={Users} tone="neutral" loading={isLoading} />
            </RevealItem>
            <RevealItem>
              <StatsCard
                label="Total Stake"
                count={totalStake}
                format={(n) => formatAda(n)}
                icon={Coins}
                tone="neutral"
                loading={isLoading}
              />
            </RevealItem>
            <RevealItem>
              <StatsCard
                label="Avg Reputation"
                count={avgRep}
                format={(n) => n.toFixed(1)}
                icon={TrendingUp}
                tone="primary"
                loading={isLoading}
              />
            </RevealItem>
            <RevealItem>
              <StatsCard
                label="Slashed"
                count={slashed}
                icon={ShieldAlert}
                tone="destructive"
                loading={isLoading}
              />
            </RevealItem>
          </RevealGroup>

          {/* Indexer cards */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : (
            <RevealGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {indexers.map((idx, i) => (
                <RevealItem key={idx.indexer_id}>
                  <IndexerCard
                    indexer={idx}
                    rank={i}
                    lastActivity={lastActivity[idx.indexer_id]}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          )}

          {/* Leaderboard table */}
          <Reveal delay={0.05}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutList className="size-4 text-muted-foreground" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pt-0">
                {isLoading ? (
                  <TableSkeleton cols={8} />
                ) : (
                  <IndexerLeaderboard indexers={indexers} />
                )}
              </CardContent>
            </Card>
          </Reveal>
        </>
      )}
    </>
  );
}
