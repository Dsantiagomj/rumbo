'use client';

import { RiCalendarLine } from '@remixicon/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsivePopover } from '@/shared/ui';
import {
  calculatePresetDates,
  type DatePreset,
  formatDateRangeDisplay,
} from '../../model/date-presets';
import { DateRangeContent } from './DateRangeContent';

interface DateRangeFilterProps {
  startDate: string | undefined;
  endDate: string | undefined;
  preset: DatePreset;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onPresetChange: (preset: DatePreset) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  preset,
  onStartDateChange,
  onEndDateChange,
  onPresetChange,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const handlePresetChange = (newPreset: DatePreset) => {
    const { startDate: newStartDate, endDate: newEndDate } = calculatePresetDates(newPreset);
    onPresetChange(newPreset);
    onStartDateChange(newStartDate ?? '');
    onEndDateChange(newEndDate ?? '');
    setOpen(false);
  };

  const handleRangeChange = (start: string | undefined, end: string | undefined) => {
    onPresetChange('custom');
    onStartDateChange(start ?? '');
    onEndDateChange(end ?? '');

    // Close popover only when range is complete (both dates set AND different)
    // react-day-picker may set from===to on first click, so we check they differ
    if (start && end && start !== end) {
      setOpen(false);
    }
  };

  const displayText = formatDateRangeDisplay(startDate, endDate, preset);

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title="Rango de fechas"
      trigger={
        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
          <RiCalendarLine className="h-4 w-4" />
          {displayText}
        </Button>
      }
    >
      <DateRangeContent
        startDate={startDate}
        endDate={endDate}
        preset={preset}
        onPresetChange={handlePresetChange}
        onRangeChange={handleRangeChange}
      />
    </ResponsivePopover>
  );
}
