import { format, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export type DatePreset = 'week' | 'month' | '30days' | 'custom' | 'all';

export interface DateRange {
  startDate: string | undefined; // YYYY-MM-DD
  endDate: string | undefined; // YYYY-MM-DD
}

export interface PresetOption {
  id: DatePreset;
  label: string;
}

export const DATE_PRESETS: PresetOption[] = [
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: '30days', label: 'Últimos 30 días' },
  { id: 'all', label: 'Todo' },
];

/**
 * Calculate start and end dates for a given preset.
 * All date presets use today as the end date.
 */
export function calculatePresetDates(preset: DatePreset): DateRange {
  if (preset === 'all' || preset === 'custom') {
    return { startDate: undefined, endDate: undefined };
  }

  const today = new Date();
  const endDate = format(today, 'yyyy-MM-dd');

  let startDate: string;

  switch (preset) {
    case 'week':
      // Start of week with Monday as first day
      startDate = format(startOfWeek(today, { weekStartsOn: 1, locale: es }), 'yyyy-MM-dd');
      break;
    case 'month':
      startDate = format(startOfMonth(today), 'yyyy-MM-dd');
      break;
    case '30days':
      // Today minus 29 days = 30 days total including today
      startDate = format(subDays(today, 29), 'yyyy-MM-dd');
      break;
    default:
      return { startDate: undefined, endDate: undefined };
  }

  return { startDate, endDate };
}

/**
 * Format a date range for display in the UI.
 * Returns a human-readable string based on the preset or custom dates.
 */
export function formatDateRangeDisplay(
  startDate: string | undefined,
  endDate: string | undefined,
  preset: DatePreset,
): string {
  // For non-custom presets, return the preset label
  if (preset !== 'custom' && preset !== 'all') {
    const presetOption = DATE_PRESETS.find((p) => p.id === preset);
    if (presetOption) {
      return presetOption.label;
    }
  }

  // For 'all' preset, return its label
  if (preset === 'all') {
    return 'Todo';
  }

  // For custom dates, format based on what's available
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`;
  }

  if (startDate) {
    const start = new Date(startDate);
    return `Desde ${format(start, 'd MMM', { locale: es })}`;
  }

  if (endDate) {
    const end = new Date(endDate);
    return `Hasta ${format(end, 'd MMM', { locale: es })}`;
  }

  return 'Fecha';
}
