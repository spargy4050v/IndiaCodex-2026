"use client";

import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShokoStore } from "@/store/useShokoStore";
import { cn, formatRelativeTime } from "@/lib/utils";

export function Navbar() {
  const refreshing = useShokoStore((s) => s.refreshing);
  const refresh = useShokoStore((s) => s.refresh);
  const lastUpdated = useShokoStore((s) => s.lastUpdated);
  const error = useShokoStore((s) => s.error);

  const online = !error;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Activity className="size-4" />
        </div>
        <span className="font-semibold">shoko</span>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
            online
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              online ? "bg-success animate-pulse" : "bg-destructive"
            )}
          />
          {online ? "Protocol Online" : "API Unreachable"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Updated {formatRelativeTime(new Date(lastUpdated).toISOString())}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={refreshing}
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>
    </header>
  );
}
