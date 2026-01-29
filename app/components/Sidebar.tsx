'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, LayoutDashboard, BarChart3, Settings, ChevronDown, PieChart, Flame } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
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
      {
        label: 'Trends',
        href: '/dashboard/trends',
        icon: BarChart3,
        children: [
          { label: 'Portfolio Trends', href: '/dashboard/portfolio-trends', icon: PieChart },
          { label: 'Ticker Trends', href: '/dashboard/ticker-trends', icon: Flame },
        ],
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some(child => pathname === child.href);
    }
    return false;
  };

  // Auto-expand parent items when on a child page
  useEffect(() => {
    navSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children && item.children.some(child => pathname === child.href)) {
          setExpandedItems(prev =>
            prev.includes(item.label) ? prev : [...prev, item.label]
          );
        }
      });
    });
  }, [pathname]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  return (
    <aside className={`w-52 bg-zinc-950/80 backdrop-blur-md border-r border-zinc-800/50 flex flex-col ${className}`}>
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
                const parentActive = isParentActive(item);
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.includes(item.label);

                if (hasChildren) {
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleExpanded(item.label)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 transition-colors border-l-2 ${
                          parentActive
                            ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm'
                            : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className={`text-sm ${parentActive ? 'font-medium' : ''}`}>{item.label}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            const childActive = isActive(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 transition-colors border-l-2 ${
                                  childActive
                                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm'
                                    : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'
                                }`}
                              >
                                <ChildIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className={`text-sm ${childActive ? 'font-medium' : ''}`}>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

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
