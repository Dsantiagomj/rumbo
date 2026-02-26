'use client';

import { RiCalendarLine } from '@remixicon/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsivePopover } from '@/shared/ui';
import { DatePickerContent } from './DatePickerContent';

interface DatePickerFieldProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  id?: string;
}

export function DatePickerField({ value, onChange, id }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const dateValue = value ? new Date(`${value}T00:00:00`) : undefined;

  const handleSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const displayValue = dateValue ? format(dateValue, 'PPP', { locale: es }) : 'Seleccionar fecha';

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title="Fecha"
      trigger={
        <Button id={id} variant="outline" className="w-full justify-start text-left font-normal">
          <RiCalendarLine className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      }
    >
      <DatePickerContent value={dateValue} onChange={handleSelect} />
    </ResponsivePopover>
  );
}
