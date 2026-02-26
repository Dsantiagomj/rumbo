'use client';

import type { ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/shared/lib/useIsMobile';

interface ResponsivePopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  title?: string;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
}

export function ResponsivePopover({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  align = 'start',
}: ResponsivePopoverProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="appearance-none bg-transparent border-none p-0 m-0 cursor-pointer text-left w-full"
        >
          {trigger}
        </button>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            {title && (
              <SheetHeader>
                <SheetTitle>{title}</SheetTitle>
              </SheetHeader>
            )}
            <div className="p-4">{children}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
        {children}
      </PopoverContent>
    </Popover>
  );
}
