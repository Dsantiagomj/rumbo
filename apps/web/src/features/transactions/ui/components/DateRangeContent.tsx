'use client';

import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
    <div className="flex flex-col gap-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2 px-3 pt-3">
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

      {/* Range calendar */}
      <Calendar
        mode="range"
        selected={selectedRange}
        onSelect={handleCalendarSelect}
        numberOfMonths={2}
        locale={es}
      />
    </div>
  );
}
