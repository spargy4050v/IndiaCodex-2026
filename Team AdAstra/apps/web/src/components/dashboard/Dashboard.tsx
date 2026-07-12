"use client";

import {
  Boxes,
  CircleDollarSign,
  Clock4,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/states";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { NetworkHealthCard } from "@/components/dashboard/NetworkHealth";
import { AttackSimulation } from "@/components/demo/AttackSimulation";
import { OnchainPanel } from "@/components/onchain/OnchainPanel";
import { ClaimTable } from "@/components/claims/ClaimTable";
import { SlashHistory } from "@/components/slashing/SlashHistory";
import { ChartCard } from "@/components/charts/ChartCard";
import { TvlChart } from "@/components/charts/TvlChart";
import { VerificationChart } from "@/components/charts/VerificationChart";
import { SlashChart } from "@/components/charts/SlashChart";
import { IndexerHealthChart } from "@/components/charts/IndexerHealthChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/motion";
import { useShokoStore } from "@/store/useShokoStore";
import {
  buildIndexerHealth,
  buildSlashHistory,
  buildTvlHistory,
  buildVerificationHistory,
} from "@/lib/series";
import { formatAda, formatCompact } from "@/lib/utils";

export function Dashboard() {
  const {
    dashboard,
    claims,
    indexers,
    slashEvents,
    settlements,
    scriptInfo,
    loading,
    error,
    init,
  } = useShokoStore();

  if (error && !dashboard) {
    return (
      <>
        <PageHeader title="Dashboard" description="Protocol overview" />
        <ErrorState message={error} onRetry={init} />
      </>
    );
  }

  const health = dashboard?.network_health;
  const tvl =
    dashboard?.metric_breakdown.find((m) => m.metric === "TVL")?.canonical_value ?? 0;
  const slashedIndexers = indexers.filter((i) => i.slashed_amount > 0).length;
  const isLoading = loading && !dashboard;

  const tvlData = health ? buildTvlHistory(tvl, health.current_epoch) : [];
  const verificationData = buildVerificationHistory(claims);
  const slashData = buildSlashHistory(slashEvents);
  const healthData = buildIndexerHealth(indexers);

  return (
    <>
      <PageHeader
        title="Protocol Dashboard"
        description="Real-time integrity of the shoko indexer verification network."
      />

      {/* Stat cards */}
      <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <RevealItem>
          <StatsCard
            label="Total Indexers"
            count={health?.total_indexers ?? 0}
            hint={`${health?.active_indexers ?? 0} active`}
            icon={Users}
            tone="neutral"
            loading={isLoading}
          />
        </RevealItem>
        <RevealItem>
          <StatsCard
            label="Verified Claims"
            count={health?.verified_claims ?? 0}
            hint={`${health?.total_claims ?? 0} total`}
            icon={ShieldCheck}
            tone="success"
            loading={isLoading}
          />
        </RevealItem>
        <RevealItem>
          <StatsCard
            label="Slashed Indexers"
            count={slashedIndexers}
            hint={`${formatAda(health?.total_slashed ?? 0)} burned`}
            icon={ShieldAlert}
            tone="destructive"
            loading={isLoading}
          />
        </RevealItem>
        <RevealItem>
          <StatsCard
            label="Network Health"
            count={health?.integrity_score ?? 0}
            format={(n) => n.toFixed(1)}
            hint="integrity / 100"
            icon={Gauge}
            tone="primary"
            loading={isLoading}
          />
        </RevealItem>
        <RevealItem>
          <StatsCard
            label="TVL"
            count={tvl}
            format={(n) => formatAda(n)}
            hint="canonical"
            icon={CircleDollarSign}
            tone="neutral"
            loading={isLoading}
          />
        </RevealItem>
        <RevealItem>
          <StatsCard
            label="Current Epoch"
            count={health?.current_epoch ?? 0}
            format={(n) => Math.round(n).toString()}
            hint="Cardano mainnet"
            icon={Clock4}
            tone="neutral"
            loading={isLoading}
          />
        </RevealItem>
      </RevealGroup>

      {/* Network health + on-chain settlement (frontend ↔ backend ↔ chain) */}
      <Reveal delay={0.05} className="grid gap-4 lg:grid-cols-2">
        {health ? <NetworkHealthCard health={health} /> : <Card className="h-64" />}
        <OnchainPanel info={scriptInfo} settlements={settlements} />
      </Reveal>

      {/* Hero: live attack simulation */}
      <Reveal delay={0.05}>
        <AttackSimulation />
      </Reveal>

      {/* Charts */}
      <Reveal delay={0.05} className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="TVL History" description="Total value locked by epoch">
          <TvlChart data={tvlData} />
        </ChartCard>
        <ChartCard title="Verification History" description="Verified vs. invalid claims">
          <VerificationChart data={verificationData} />
        </ChartCard>
        <ChartCard title="Slash History" description="Cumulative stake slashed">
          <SlashChart data={slashData} />
        </ChartCard>
      </Reveal>

      <Reveal delay={0.05}>
        <ChartCard
          title="Indexer Health"
          description="Reputation vs. accuracy across indexers"
          height={260}
        >
          <IndexerHealthChart data={healthData} />
        </ChartCard>
      </Reveal>

      {/* Recent activity */}
      <Reveal delay={0.05} className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Claims</CardTitle>
            <Boxes className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-0">
            <ClaimTable claims={claims.slice(0, 6)} indexers={indexers} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Slash Events</CardTitle>
            <ShieldAlert className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-0">
            <SlashHistory events={slashEvents.slice(0, 6)} indexers={indexers} />
          </CardContent>
        </Card>
      </Reveal>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        Canonical values reconciled from Koios &amp; Blockfrost ·{" "}
        {formatCompact(health?.total_claims ?? 0)} claims processed · settled on{" "}
        {scriptInfo?.network ?? "Cardano"}
      </p>
    </>
  );
}
