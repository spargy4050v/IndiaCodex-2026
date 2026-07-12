import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "destructive" | "neutral";

const TONE: Record<Tone, string> = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  destructive: "bg-destructive/12 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

export function StatsCard({
  label,
  value,
  count,
  format,
  icon: Icon,
  tone = "neutral",
  hint,
  loading,
}: {
  label: string;
  /** Static value (used when `count` is not provided). */
  value?: React.ReactNode;
  /** Numeric value — animates via a counter tween. */
  count?: number;
  format?: (n: number) => string;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card className="card-hover relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-[26px] font-semibold leading-none tracking-tight text-foreground tnum">
              {count !== undefined ? (
                <AnimatedCounter value={count} format={format} />
              ) : (
                value
              )}
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
            "flex size-10 items-center justify-center rounded-xl",
            TONE[tone]
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
