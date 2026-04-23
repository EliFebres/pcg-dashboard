'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { Select } from '@/app/components/ui/Select';
import type { KpiScope } from '@/app/lib/api/kpi';

export const KPI_DELIVERY_TEAMS = [
  'Portfolio Consulting Group',
  'Equity Specialist',
  'Fixed Income Specialist',
] as const;

interface ScopeSelectorProps {
  value: KpiScope;
  onChange: (scope: KpiScope) => void;
}

const OPTIONS = [
  { value: 'all', label: 'All Teams' },
  ...KPI_DELIVERY_TEAMS.map(t => ({ value: `team:${t}`, label: t })),
];

export default function ScopeSelector({ value, onChange }: ScopeSelectorProps) {
  const currentLabel = OPTIONS.find(o => o.value === value)?.label ?? 'All Teams';
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as KpiScope)}
      options={OPTIONS}
      matchTriggerWidth={false}
      triggerClassName="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-500 hover:to-cyan-400 transition-all focus:outline-none"
      triggerIcon={<Users className="w-4 h-4" />}
      triggerLabel={currentLabel}
    />
  );
}
