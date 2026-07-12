"use client";

import { useShokoData } from "@/hooks/useShokoData";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  useShokoData();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="relative flex-1 px-4 pb-24 pt-6 lg:px-6 lg:pb-10">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40" />
          <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
