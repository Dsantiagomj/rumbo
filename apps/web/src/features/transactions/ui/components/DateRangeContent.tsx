'use client';

import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useIsMobile } from '@/shared/lib/useIsMobile';
import { DATE_PRESETS, type DatePreset } from '../../model/date-presets';

interface DateRangeContentProps {
  startDate: string | undefined; // YYYY-MM-DD
  endDate: string | undefined; // YYYY-MM-DD
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  onRangeChange: (start: string | undefined, end: string | undefined) => void;
}

/**
 * Parse a YYYY-MM-DD string to a Date object.
 * Returns undefined if the input is undefined or invalid.
 */
function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

/**
 * Format a Date object to a YYYY-MM-DD string.
 * Returns undefined if the input is undefined.
 */
function formatDate(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  return format(date, 'yyyy-MM-dd');
}

export function DateRangeContent({
  startDate,
  endDate,
  preset,
  onPresetChange,
  onRangeChange,
}: DateRangeContentProps) {
  const isMobile = useIsMobile();

  // Convert string dates to Date objects for Calendar
  const selectedRange: DayPickerRange | undefined =
    startDate || endDate
      ? {
          from: parseDate(startDate),
          to: parseDate(endDate),
        }
      : undefined;

  const handleCalendarSelect = (range: DayPickerRange | undefined) => {
    onRangeChange(formatDate(range?.from), formatDate(range?.to));
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((presetOption) => {
          const isActive = preset === presetOption.id;
          return (
            <Button
              key={presetOption.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              data-active={isActive ? 'true' : undefined}
              onClick={() => onPresetChange(presetOption.id)}
            >
              {presetOption.label}
            </Button>
          );
        })}
      </div>

      <div className="h-px bg-border" />

      {/* Range calendar - 1 month on mobile (full width), 2 on desktop */}
      <Calendar
        mode="range"
        selected={selectedRange}
        onSelect={handleCalendarSelect}
        numberOfMonths={isMobile ? 1 : 2}
        locale={es}
        className="w-full"
        classNames={
          isMobile
            ? {
                // Make calendar stretch to full width on mobile
                months: 'flex w-full',
                month: 'flex flex-col gap-4 w-full',
                month_grid: 'w-full',
                weekdays: 'flex w-full justify-between',
                weekday: 'text-muted-foreground font-normal text-[0.8rem] flex-1 text-center',
                week: 'flex w-full justify-between mt-2',
                day: 'flex-1 aspect-square text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day_button:
                  'w-full h-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md',
              }
            : undefined
        }
      />
    </div>
  );
}
