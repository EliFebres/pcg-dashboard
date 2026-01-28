'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, LayoutDashboard, BarChart3, FilePlus, MessageSquare, Settings } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Engagements',
    items: [
      { label: 'Client Interactions', href: '/dashboard/client-interactions', icon: LayoutDashboard },
      { label: 'Trends', href: '/dashboard/trends', icon: BarChart3 },
    ],
  },
  {
    title: 'Forms',
    items: [
      { label: 'New Project', href: '/dashboard/new-project', icon: FilePlus },
      { label: 'Touch Points', href: '/dashboard/touch-points', icon: MessageSquare },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <aside className={`w-48 bg-zinc-950/80 backdrop-blur-md border-r border-zinc-800/50 flex flex-col ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="relative px-3 py-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white tracking-tight">PCG Insights</h1>
            <p className="text-xs text-zinc-500 truncate">Dimensional</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-1.5 py-2 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="mb-3">
            <p className="px-2 text-xs font-medium text-zinc-600 uppercase tracking-wider mb-1">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 transition-colors border-l-2 ${
                      active
                        ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm'
                        : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className={`text-sm ${active ? 'font-medium' : ''}`}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile & Settings */}
      <div className="relative px-1.5 py-2 border-t border-zinc-800/50">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
            EF
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">Eli F.</p>
            <p className="text-xs text-zinc-500">Associate</p>
          </div>
          <button className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors flex-shrink-0">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
