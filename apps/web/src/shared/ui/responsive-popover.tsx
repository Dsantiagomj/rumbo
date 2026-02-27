'use client';

import type React from 'react';
import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/shared/lib/useIsMobile';

interface ResponsivePopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void; type?: string }>;
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

  const originalOnClick = trigger.props.onClick;

  const triggerWithDefaultType = isValidElement(trigger)
    ? cloneElement(trigger, {
        type: trigger.props.type ?? 'button',
      } as React.HTMLAttributes<HTMLElement>)
    : trigger;

  const triggerWithMobileHandler = isValidElement(triggerWithDefaultType)
    ? cloneElement(triggerWithDefaultType, {
        onClick: (event: MouseEvent<HTMLElement>) => {
          originalOnClick?.(event);

          if (!event.defaultPrevented) {
            onOpenChange(true);
          }
        },
      } as React.HTMLAttributes<HTMLElement>)
    : triggerWithDefaultType;

  if (isMobile) {
    return (
      <>
        {triggerWithMobileHandler}
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
      <PopoverTrigger asChild>{triggerWithDefaultType}</PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
        {children}
      </PopoverContent>
    </Popover>
  );
}
