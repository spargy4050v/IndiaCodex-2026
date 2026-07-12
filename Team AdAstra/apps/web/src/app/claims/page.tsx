"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/states";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { ClaimTable } from "@/components/claims/ClaimTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useShokoStore } from "@/store/useShokoStore";
import type { ClaimStatus } from "@/types";

const FILTERS: Array<{ key: "ALL" | ClaimStatus; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "VERIFIED", label: "Verified" },
  { key: "PENDING", label: "Pending" },
  { key: "CHALLENGED", label: "Challenged" },
  { key: "SLASHED", label: "Slashed" },
  { key: "INVALID", label: "Invalid" },
];

export default function ClaimsPage() {
  const { claims, indexers, loading, error, init } = useShokoStore();
  const [filter, setFilter] = useState<"ALL" | ClaimStatus>("ALL");

  const filtered = useMemo(
    () => (filter === "ALL" ? claims : claims.filter((c) => c.status === filter)),
    [claims, filter]
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: claims.length };
    for (const c of claims) map[c.status] = (map[c.status] ?? 0) + 1;
    return map;
  }, [claims]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claims"
        description="Every metric assertion submitted to the protocol."
      />

      {error && !claims.length ? (
        <ErrorState message={error} onRetry={init} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  filter === f.key
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {f.label}
                <Badge variant="secondary" className="px-1.5">
                  {counts[f.key] ?? 0}
                </Badge>
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="px-0 pt-0">
              {loading && !claims.length ? (
                <TableSkeleton cols={7} />
              ) : (
                <ClaimTable claims={filtered} indexers={indexers} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
