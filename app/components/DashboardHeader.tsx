'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, ChevronDown, Check } from 'lucide-react';

export interface FilterDropdown {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export interface PeriodOption {
  value: string;
  label: string;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: '1W', label: '1 Week' },
  { value: '1M', label: '1 Month' },
  { value: '3M', label: '3 Months' },
  { value: '6M', label: '6 Months' },
  { value: 'YTD', label: 'Year to Date' },
  { value: '1Y', label: '1 Year' },
  { value: 'ALL', label: 'All Time' },
];

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FilterDropdown[];
  period?: string;
  onPeriodChange?: (value: string) => void;
  periodOptions?: string[]; // Custom period options (e.g., ['1M', '3M', '6M', '1Y', 'ALL'])
  className?: string;
  actionButtonLabel?: string;
  onActionButtonClick?: () => void;
}

// Dropdown component for filters
function FilterDropdownButton({ filter }: { filter: FilterDropdown }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const IconComponent = filter.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFiltered = filter.value !== filter.options[0]; // First option is "All"

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 backdrop-blur-sm border text-sm transition-colors ${
          isFiltered
            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            : 'bg-zinc-900/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50'
        }`}
      >
        <IconComponent className={`w-4 h-4 ${isFiltered ? 'text-cyan-400' : 'text-zinc-500'}`} />
        {filter.value}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${isFiltered ? 'text-cyan-400' : 'text-zinc-500'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 shadow-xl z-[100]">
          {filter.options.map((option) => (
            <button
              key={option}
              onClick={() => {
                filter.onChange(option);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                filter.value === option
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-zinc-300 hover:bg-white/[0.05]'
              }`}
            >
              {option}
              {filter.value === option && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Period dropdown component
function PeriodDropdown({ value, onChange, customOptions }: { value: string; onChange: (value: string) => void; customOptions?: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use custom options if provided, otherwise use default PERIOD_OPTIONS
  const options = customOptions
    ? customOptions.map(val => ({ value: val, label: PERIOD_OPTIONS.find(p => p.value === val)?.label || val }))
    : PERIOD_OPTIONS;

  const currentOption = options.find((p) => p.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-500 hover:to-cyan-400 transition-all"
      >
        <Calendar className="w-4 h-4" />
        {currentOption.value}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 min-w-[140px] bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 shadow-xl z-[100]">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                value === option.value
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-zinc-300 hover:bg-white/[0.05]'
              }`}
            >
              {option.label}
              {value === option.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardHeader({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  period = '1Y',
  onPeriodChange,
  periodOptions,
  className = '',
  actionButtonLabel,
  onActionButtonClick,
}: DashboardHeaderProps) {
  return (
    <header className={`flex-shrink-0 bg-black/80 backdrop-blur-md border-b border-zinc-800/50 relative z-50 ${className}`}>
      <div className="px-6 py-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-zinc-500 text-sm">{subtitle}</p>
        </div>
        {/* Global Filters */}
        <div className="flex items-center gap-2">
          <div className="relative w-[360px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          {filters.map((filter) => (
            <FilterDropdownButton key={filter.id} filter={filter} />
          ))}
          {onPeriodChange ? (
            <PeriodDropdown value={period} onChange={onPeriodChange} customOptions={periodOptions} />
          ) : (
            <button className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-500 hover:to-cyan-400 transition-all">
              <Calendar className="w-4 h-4" />
              {period}
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
          {actionButtonLabel && onActionButtonClick && (
            <>
              <div className="flex-1" />
              <button
                onClick={onActionButtonClick}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-500 hover:to-cyan-400 transition-all"
              >
                {actionButtonLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
