import type { Metadata } from "next";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { MiniPlayerWrapper } from "@/components/layout/mini-player-wrapper";

export const metadata: Metadata = {
  title: {
    template: "%s | NotCast",
    default: "Dashboard | NotCast",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <DashboardNav />
      {/* pb-20: mini player için alt boşluk */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl pb-20">
        {children}
      </main>
      <MiniPlayerWrapper />
    </div>
  );
}
