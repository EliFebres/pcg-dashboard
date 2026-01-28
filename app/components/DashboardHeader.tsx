'use client';

import React from 'react';
import { Search, Calendar, ChevronDown } from 'lucide-react';

interface FilterButton {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FilterButton[];
  className?: string;
}

export default function DashboardHeader({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  className = '',
}: DashboardHeaderProps) {
  return (
    <header className={`flex-shrink-0 bg-black/80 backdrop-blur-md border-b border-zinc-800/50 ${className}`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="text-zinc-500 text-sm">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-cyan-400">
            <span className="px-2 py-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/10 border border-cyan-500/20 backdrop-blur-sm">Viewing: 1YR</span>
          </div>
        </div>
        {/* Global Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          {filters.map((filter, index) => {
            const IconComponent = filter.icon;
            return (
              <button
                key={index}
                onClick={filter.onClick}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-colors"
              >
                <IconComponent className="w-4 h-4 text-zinc-500" />
                {filter.label}
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </button>
            );
          })}
          <button className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-500 hover:to-cyan-400 transition-all">
            <Calendar className="w-4 h-4" />
            1YR
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
