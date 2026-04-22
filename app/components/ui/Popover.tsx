'use client';

import * as React from 'react';
import * as RadixPopover from '@radix-ui/react-popover';

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;
export const PopoverClose = RadixPopover.Close;

interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof RadixPopover.Content> {
  /** Override the default glass styling entirely. */
  className?: string;
}

/**
 * Glass-styled popover content. Uses Radix's Portal internally so the menu
 * escapes any overflow/backdrop-filter containing blocks automatically.
 */
export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof RadixPopover.Content>,
  PopoverContentProps
>(function PopoverContent(
  { className = '', align = 'start', sideOffset = 4, children, ...props },
  ref
) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={`z-[9999] bg-zinc-900 border border-zinc-700/50 shadow-xl origin-[var(--radix-popover-content-transform-origin)] transition-all duration-200 ease-out data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=closed]:scale-95 ${className}`}
        {...props}
      >
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
});
