'use client';

import Sidebar from '@/app/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      <Sidebar className="flex-shrink-0" />

      {/* Main Content Area with top spacing and rounded corner */}
      <div className="flex-1 flex flex-col pt-[23px] overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden bg-black rounded-tl-2xl border-l border-t border-zinc-800/50">
          {children}
        </main>
      </div>
    </div>
  );
}
