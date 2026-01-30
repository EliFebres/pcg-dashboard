'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, ChevronDown, Check, Filter } from 'lucide-react';

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
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Check if any filter is active (not on default "All" option)
  const hasActiveFilters = filters.some(filter => filter.value !== filter.options[0]);

  return (
    <header className={`flex-shrink-0 bg-black/80 backdrop-blur-md border-b border-zinc-800/50 relative z-50 ${className}`}>
      <div className="px-6 py-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-zinc-500 text-sm">{subtitle}</p>
        </div>
        {/* Global Filters */}
        <div className="flex items-center gap-2 h-9">
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

          {/* Filter Toggle Button */}
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`relative flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 overflow-hidden group/filter ${
              hasActiveFilters ? 'ring-2 ring-cyan-400/50' : ''
            } ${filtersExpanded ? 'w-0 h-0 p-0 opacity-0 mr-0' : 'w-9 h-9 opacity-100 mr-0'}`}
          >
            {/* Glass shine animation */}
            {!filtersExpanded && (
              <span
                className="absolute inset-0 pointer-events-none animate-[shine_3s_ease-in-out_infinite]"
                style={{
                  background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)',
                }}
              />
            )}
            <Filter className={`relative z-10 w-4 h-4 transition-all duration-300 ${filtersExpanded ? 'scale-0' : 'scale-100'}`} />
            {hasActiveFilters && !filtersExpanded && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full z-20" />
            )}
          </button>

          {/* Animated Filters Container */}
          <div
            className={`flex items-center overflow-hidden transition-all duration-1000 ease-out whitespace-nowrap ${
              filtersExpanded ? 'max-w-[1000px] opacity-100 gap-2' : 'max-w-0 opacity-0 gap-0'
            }`}
            style={{
              transitionDelay: filtersExpanded ? '200ms' : '0ms'
            }}
          >
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
          </div>

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
