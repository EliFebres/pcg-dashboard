'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ChevronDown, PieChart, Flame, User, LogOut, Users, UserCheck, PanelLeftClose, PanelLeftOpen, Swords, TrendingUp, Landmark } from 'lucide-react';
import { useCurrentUser } from '@/app/lib/auth/context';
import { toDisplayName } from '@/app/lib/auth/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  disabled?: boolean;
  activePrefix?: string; // Highlight when pathname starts with this prefix
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Interactions & Trends',
    items: [
      { label: 'Client Interactions', href: '/dashboard/client-interactions', icon: LayoutDashboard },
      { label: 'Portfolio Trends', href: '/dashboard/trends/portfolio-trends', icon: PieChart, disabled: true },
      { label: 'Ticker Trends', href: '/dashboard/trends/ticker-trends', icon: Flame, disabled: true },
    ],
  },
  {
    title: 'Competitive Landscape',
    items: [
      { label: 'Equity', href: '/dashboard/competitive/equity', icon: TrendingUp, disabled: true },
      { label: 'Fixed Income', href: '/dashboard/competitive/fixed-income', icon: Landmark, disabled: true },
      { label: 'vs. Competitor', href: '/dashboard/competitive/vs-competitor', icon: Swords, disabled: true },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

// Always display as "First L." (e.g., "Eli Febres" → "Eli F.")
function formatDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setIsCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const getExpandedItemsForPath = (path: string) => {
    const items: string[] = [];
    navSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children && item.children.some(child => path === child.href)) {
          items.push(item.label);
        }
      });
    });
    return items;
  };

  const [expandedItems, setExpandedItems] = useState<string[]>(() => getExpandedItemsForPath(pathname));
  const [disabledTooltipPos, setDisabledTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const prevPathnameRef = useRef(pathname);

  const isActive = (href: string, activePrefix?: string) =>
    activePrefix ? pathname.startsWith(activePrefix) : pathname === href;
  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some(child => pathname === child.href);
    }
    return false;
  };

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      const newExpanded = getExpandedItemsForPath(pathname);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedItems(newExpanded);
    }
  }, [pathname]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const displayName = user ? formatDisplayName(`${user.firstName} ${user.lastName}`) : '...';

  return (
    <aside className={`${isCollapsed ? 'w-14' : 'w-56'} transition-all duration-200 ${isCollapsed ? '' : 'overflow-x-hidden'} bg-[#111113] flex flex-col font-[family-name:var(--font-inter)] ${className}`}>

      {/* Header: dashboard icon (left) + collapse toggle (right) */}
      <div className={`px-2 pt-6 pb-3 flex items-center flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" className="flex-shrink-0">
              <path d="M50 5A45 45 0 1 1 12 32" stroke="url(#sidebar-icon-gradient)" strokeWidth="8" strokeLinecap="round" fill="none"/>
              <path d="M50 24A26 26 0 1 0 72 66" stroke="url(#sidebar-icon-gradient)" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.4"/>
              <circle cx="50" cy="50" r="7" fill="url(#sidebar-icon-gradient)"/>
            </svg>
            <span className="text-[1.05rem] font-semibold tracking-wide text-white">PCG Tools</span>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors flex-shrink-0"
        >
          {isCollapsed
            ? <PanelLeftOpen className="w-4 h-4" />
            : <PanelLeftClose className="w-4 h-4" />
          }
        </button>
        {/* SVG gradient definition for icon stroke */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="sidebar-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="border-t border-zinc-800/50 mx-2 my-1.5" />

      {/* Navigation */}
      <nav className="relative flex-1 px-1.5 py-2 ${isCollapsed ? '' : 'overflow-y-auto overflow-x-hidden'}">
        {navSections.map((section) => (
          <div key={section.title} className="mb-3">
            {!isCollapsed && (
              <p className="px-2 text-xs font-medium text-zinc-600 uppercase tracking-wider mb-1">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.activePrefix);
                const parentActive = isParentActive(item);
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.includes(item.label);
                const isDisabled = item.disabled === true;

                if (hasChildren) {
                  if (isDisabled) {
                    return (
                      <div key={item.label} className="relative group">
                        <div className={`w-full flex items-center border-l-2 border-transparent opacity-40 cursor-not-allowed ${isCollapsed ? 'justify-center px-0 py-2' : 'justify-between px-2 py-2'}`}>
                          <div className={`flex items-center ${isCollapsed ? '' : 'gap-2.5'}`}>
                            <Icon className="w-5 h-5 flex-shrink-0 text-zinc-600" />
                            {!isCollapsed && <span className="text-[0.9rem] font-semibold tracking-wide text-zinc-600">{item.label}</span>}
                          </div>
                          {!isCollapsed && <ChevronDown className="w-4 h-4 text-zinc-600" />}
                        </div>
                        {/* Tooltip — "Under Construction" always; also serves as label when collapsed */}
                        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-opacity">
                          Under Construction
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={item.label} className="relative group">
                      <button
                        onClick={() => !isCollapsed && toggleExpanded(item.label)}
                        className={`w-full flex items-center transition-colors border-l-2 ${isCollapsed ? `justify-center px-0 py-2 ${parentActive ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'}` : `justify-between px-2 py-2 ${parentActive ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'}`}`}
                      >
                        <div className={`flex items-center ${isCollapsed ? '' : 'gap-2.5'}`}>
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!isCollapsed && <span className="text-[0.9rem] font-semibold tracking-wide">{item.label}</span>}
                        </div>
                        {!isCollapsed && <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                      </button>
                      {/* Tooltip (label in collapsed mode) */}
                      {isCollapsed && (
                        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-opacity">
                          {item.label}
                        </span>
                      )}
                      {isExpanded && !isCollapsed && (
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

                if (isDisabled) {
                  return (
                    <div
                      key={item.href}
                      className="relative"
                      onMouseMove={(e) => setDisabledTooltipPos({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setDisabledTooltipPos(null)}
                    >
                      <div className={`w-full flex items-center border-l-2 border-transparent opacity-40 cursor-not-allowed ${isCollapsed ? 'justify-center px-0 py-2' : 'px-2 py-2 gap-2.5'}`}>
                        <Icon className="w-5 h-5 flex-shrink-0 text-zinc-600" />
                        {!isCollapsed && <span className="text-[0.9rem] font-semibold tracking-wide text-zinc-600">{item.label}</span>}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      className={`w-full flex items-center transition-colors border-l-2 ${isCollapsed ? `justify-center px-0 py-2 ${active ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'}` : `px-2 py-2 gap-2.5 ${active ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'}`}`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span className="text-[0.9rem] font-semibold tracking-wide">{item.label}</span>}
                    </Link>
                    {/* Tooltip (label in collapsed mode) */}
                    {isCollapsed && (
                      <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-opacity">
                        {item.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin section — only visible to admins */}
      {user?.role === 'admin' && (
        <div className="px-1.5 pb-1">
          <div className="mb-1">
            {!isCollapsed && (
              <p className="px-2 text-xs font-medium text-zinc-600 uppercase tracking-wider mb-0.5">Admin</p>
            )}
            <div className="relative group">
              <Link
                href="/admin/users"
                className={`w-full flex items-center transition-colors border-l-2 ${isCollapsed ? `justify-center px-0 py-2 ${pathname === '/admin/users' ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'}` : `px-2 py-2 gap-2.5 ${pathname === '/admin/users' ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'}`}`}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-[0.9rem] font-semibold tracking-wide">User Management</span>}
              </Link>
              {isCollapsed && (
                <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-opacity">
                  User Management
                </span>
              )}
            </div>
            <div className="relative group">
              <Link
                href="/admin/team-members"
                className={`w-full flex items-center transition-colors border-l-2 ${isCollapsed ? `justify-center px-0 py-2 ${pathname === '/admin/team-members' ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'}` : `px-2 py-2 gap-2.5 ${pathname === '/admin/team-members' ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-cyan-400 border-cyan-400 backdrop-blur-sm' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border-transparent'}`}`}
              >
                <UserCheck className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-[0.9rem] font-semibold tracking-wide">Team Members</span>}
              </Link>
              {isCollapsed && (
                <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-opacity">
                  Team Members
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer: Logout + divider + User Profile */}
      <div className="relative px-1.5 pt-3 pb-[20px] flex-shrink-0">
        {/* Logout */}
        <div className="relative group">
          <button
            className={`w-full flex items-center text-red-400/70 hover:bg-red-500/[0.06] hover:text-red-400 border-l-2 border-transparent transition-colors ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2 py-2'}`}
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/';
            }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-[0.9rem] font-semibold tracking-wide">Log Out</span>}
          </button>
          {isCollapsed && (
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-opacity">
              Log Out
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-800/50 my-2" />

        {/* User Profile */}
        <div className={`relative group flex items-center px-2 py-2 rounded-lg ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between gap-1.5">
                <p className="text-[1.21rem] font-semibold text-zinc-200 truncate tracking-wide leading-tight">
                  {displayName}
                </p>
                {user?.role === 'admin' && (
                  <span className="flex-shrink-0 text-[0.6rem] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Tooltip with full name when collapsed */}
          {isCollapsed && (
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-opacity">
              {user ? `${user.firstName} ${user.lastName}` : '...'}
            </span>
          )}
        </div>
      </div>

      {disabledTooltipPos && (
        <span
          className="fixed px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md whitespace-nowrap pointer-events-none z-50"
          style={{ left: disabledTooltipPos.x + 14, top: disabledTooltipPos.y + 4 }}
        >
          Under Construction
        </span>
      )}
    </aside>
  );
}
