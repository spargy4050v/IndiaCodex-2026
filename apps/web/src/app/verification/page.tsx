"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/states";
import { VerificationConsole } from "@/components/verification/VerificationConsole";
import { MetricConsensus } from "@/components/verification/MetricConsensus";
import { ChartCard } from "@/components/charts/ChartCard";
import { VerificationChart } from "@/components/charts/VerificationChart";
import { Skeleton } from "@/components/ui/skeleton";
import { buildVerificationHistory } from "@/lib/series";
import { useShokoStore } from "@/store/useShokoStore";

export default function VerificationPage() {
  const { dashboard, claims, loading, error, init } = useShokoStore();

  if (error && !dashboard) {
    return (
      <div className="space-y-6">
        <PageHeader title="Verification" />
        <ErrorState message={error} onRetry={init} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification"
        description="Cross-check indexer claims against canonical multi-provider consensus."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <VerificationConsole />
        {dashboard ? (
          <MetricConsensus
            breakdown={dashboard.metric_breakdown}
            metadata={dashboard.metric_metadata}
          />
        ) : (
          <Skeleton className="h-96 w-full rounded-xl" />
        )}
      </div>

      <ChartCard
        title="Verification History"
        description="Verified vs. invalid claims over time"
      >
        <VerificationChart data={buildVerificationHistory(claims)} />
      </ChartCard>

      {loading && !dashboard && (
        <p className="text-center text-sm text-muted-foreground">Loading protocol data…</p>
      )}
    </div>
  );
}
