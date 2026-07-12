import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "destructive";

const TONE: Record<Tone, string> = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          )}
          {hint &&
            (loading ? (
              <Skeleton className="h-3 w-16" />
            ) : (
              <p className="text-xs text-muted-foreground">{hint}</p>
            ))}
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            TONE[tone]
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
