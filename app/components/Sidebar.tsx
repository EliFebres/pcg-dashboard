'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, ChevronDown, PieChart, Flame, ChevronsUpDown, User, Settings, HelpCircle } from 'lucide-react';

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
          { label: 'Portfolio Trends', href: '/dashboard/trends/portfolio-trends', icon: PieChart },
          { label: 'Ticker Trends', href: '/dashboard/trends/ticker-trends', icon: Flame },
        ],
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

// Shorten long names by abbreviating the last name (e.g., "Trace Williams" → "Trace W.")
function formatDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  // If the full name is short enough, return as-is
  if (fullName.length <= 14) return fullName;
  return `${firstName} ${lastName[0]}.`;
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

  // Auto-expand parent items when on a child page, collapse when navigating away
  useEffect(() => {
    const itemsToExpand: string[] = [];

    navSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children && item.children.some(child => pathname === child.href)) {
          itemsToExpand.push(item.label);
        }
      });
    });

    setExpandedItems(itemsToExpand);
  }, [pathname]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  return (
    <aside className={`w-56 bg-[#111113] flex flex-col font-[family-name:var(--font-inter)] ${className}`}>
      {/* User Profile Header */}
      <div className="relative px-2 py-3 border-b border-zinc-800/50">
        <button
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer"
          onClick={() => {
            // TODO: Open user profile menu/modal
            console.log('User profile clicked');
          }}
        >
          {/* Profile Picture */}
          <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>

          {/* Name and Role */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[1.21rem] font-semibold text-zinc-200 truncate tracking-wide leading-tight">{formatDisplayName('Eli Febres')}</p>
            <p className="text-[0.86rem] text-zinc-500 truncate -mt-0.5">Associate</p>
          </div>

          {/* Up-Down Arrow */}
          <ChevronsUpDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        </button>
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
                        className={`w-full flex items-center justify-between px-2 py-2 transition-colors border-l-2 ${
                          parentActive
                            ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm'
                            : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="text-[0.9rem] font-semibold tracking-wide">{item.label}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                                className={`w-full flex items-center gap-2.5 px-2 py-1.5 transition-colors border-l-2 ${
                                  childActive
                                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm'
                                    : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'
                                }`}
                              >
                                <ChildIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-[0.85rem] font-semibold tracking-wide">{child.label}</span>
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
                    className={`w-full flex items-center gap-2.5 px-2 py-2 transition-colors border-l-2 ${
                      active
                        ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm'
                        : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[0.9rem] font-semibold tracking-wide">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Actions - adjust pb-[20px] to change bottom spacing */}
      <div className="relative px-1.5 pt-3 pb-[20px]">
        <div className="space-y-0.5">
          <button
            className="w-full flex items-center gap-2.5 px-2 py-2 text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-l-2 border-transparent transition-colors"
            onClick={() => {
              // TODO: Open settings
              console.log('Settings clicked');
            }}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="text-[0.9rem] font-semibold tracking-wide">Settings</span>
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-2 py-2 text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-l-2 border-transparent transition-colors"
            onClick={() => {
              // TODO: Open help center
              console.log('Help Center clicked');
            }}
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-[0.9rem] font-semibold tracking-wide">Help Center</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
