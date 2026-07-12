"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileCheck2,
  LayoutDashboard,
  ScrollText,
  ShieldAlert,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/claims", label: "Claims", icon: ScrollText },
  { href: "/indexers", label: "Indexers", icon: Users },
  { href: "/verification", label: "Verification", icon: FileCheck2 },
  { href: "/slash-events", label: "Slash Events", icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="size-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">shoko</p>
          <p className="text-[11px] text-muted-foreground">Verification Protocol</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">Cardano · Mainnet</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Canonical data via Koios &amp; Blockfrost consensus.
          </p>
        </div>
      </div>
    </aside>
  );
}
