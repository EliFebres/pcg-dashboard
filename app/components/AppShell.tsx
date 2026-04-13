'use client';

import React from 'react';
import Sidebar from '@/app/components/dashboard/Sidebar';
import { AuthProvider } from '@/app/lib/auth/context';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="h-screen bg-[#111113] flex overflow-hidden">
        <Sidebar className="flex-shrink-0" />

        {/* Main Content Area with top spacing and rounded corner */}
        <div className="flex-1 flex flex-col pt-[21px] overflow-hidden">
          {/* Single background container for both header and content */}
          <div
            className="flex-1 flex flex-col rounded-tl-2xl border-l border-t border-zinc-800/50 relative overflow-hidden"
            style={{ backgroundColor: '#050508' }}
          >
            {/* Glow blobs */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '-10%',
                left: '-5%',
                width: '50%',
                height: '50%',
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
                filter: 'blur(60px)',
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '10%',
                right: '-10%',
                width: '45%',
                height: '45%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.10) 0%, transparent 70%)',
                filter: 'blur(80px)',
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                top: '40%',
                left: '30%',
                width: '30%',
                height: '30%',
                background: 'radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 70%)',
                filter: 'blur(60px)',
              }}
            />

            {/* Scrollable content area */}
            <main className="flex-1 overflow-y-auto relative z-10">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
