'use client';

import * as React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

type OptionInput = readonly string[] | ReadonlyArray<{ label: string; value: string }>;

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: OptionInput;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  /** Override the trigger's className entirely — used by PeriodDropdown for its gradient button. */
  triggerClassName?: string;
  /** Icon rendered on the left side of the trigger (e.g., Calendar). */
  triggerIcon?: React.ReactNode;
  /** Override the text shown in the trigger (defaults to the selected option's label). */
  triggerLabel?: React.ReactNode;
  /** Limit the content width to the trigger width. Defaults to true. */
  matchTriggerWidth?: boolean;
  'aria-label'?: string;
}

function normalize(options: OptionInput): ReadonlyArray<{ label: string; value: string }> {
  return options.map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  hasError = false,
  disabled = false,
  triggerClassName,
  triggerIcon,
  triggerLabel,
  matchTriggerWidth = true,
  'aria-label': ariaLabel,
}: SelectProps) {
  const normalized = normalize(options);

  const defaultTriggerClass = `w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-zinc-800/40 backdrop-blur-sm border rounded-lg text-sm transition-colors focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
    hasError
      ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
      : 'border-zinc-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/30'
  } ${value ? 'text-zinc-100' : 'text-zinc-500'}`;

  return (
    <RadixSelect.Root value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={triggerClassName ?? defaultTriggerClass}
      >
        {triggerIcon}
        <RadixSelect.Value placeholder={placeholder}>
          {triggerLabel}
        </RadixSelect.Value>
        <RadixSelect.Icon asChild>
          <ChevronDown className="w-4 h-4 flex-shrink-0 text-zinc-500" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className={`z-[9999] overflow-hidden bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-lg shadow-xl ${
            matchTriggerWidth ? 'min-w-[var(--radix-select-trigger-width)]' : ''
          } max-h-[var(--radix-select-content-available-height)]`}
        >
          <RadixSelect.Viewport className="p-1">
            {normalized.map(opt => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className="relative flex items-center justify-between gap-4 px-3 py-2 text-sm text-zinc-200 rounded cursor-pointer outline-none select-none data-[highlighted]:bg-white/[0.06] data-[state=checked]:bg-cyan-500/15 data-[state=checked]:text-cyan-400 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check className="w-4 h-4" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
