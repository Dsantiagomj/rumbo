'use client';

import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

interface DatePickerContentProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
}

export function DatePickerContent({ value, onChange }: DatePickerContentProps) {
  const today = new Date();
  const yesterday = subDays(today, 1);

  const isToday = value && format(value, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  const isYesterday = value && format(value, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 px-3 pt-3">
        <Button
          variant={isToday ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => onChange(today)}
        >
          Hoy
        </Button>
        <Button
          variant={isYesterday ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => onChange(yesterday)}
        >
          Ayer
        </Button>
      </div>
      <Calendar
        mode="single"
        selected={value}
        onSelect={(date) => date && onChange(date)}
        locale={es}
        autoFocus
      />
    </div>
  );
}
