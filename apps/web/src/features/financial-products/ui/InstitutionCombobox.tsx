import { RiArrowDownSLine, RiCheckLine } from '@remixicon/react';
import { INSTITUTIONS } from '@rumbo/shared';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const INSTITUTION_TYPE_LABELS: Record<string, string> = {
  bank: 'Bancos',
  fintech: 'Fintech',
  cooperative: 'Cooperativas',
  other: 'Otros',
};

const groupedInstitutions = INSTITUTIONS.reduce(
  (acc, inst) => {
    if (!acc[inst.type]) acc[inst.type] = [];
    acc[inst.type].push(inst);
    return acc;
  },
  {} as Record<string, (typeof INSTITUTIONS)[number][]>,
);

export type InstitutionComboboxProps = {
  value: string;
  onChange: (value: string) => void;
};

export function InstitutionCombobox({ value, onChange }: InstitutionComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || 'Selecciona una institucion...'}
          <RiArrowDownSLine className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar institucion..." />
          <CommandList>
            <CommandEmpty>No se encontro la institucion.</CommandEmpty>
            {Object.entries(groupedInstitutions).map(([type, institutions]) => (
              <CommandGroup key={type} heading={INSTITUTION_TYPE_LABELS[type] ?? type}>
                {institutions.map((inst) => (
                  <CommandItem
                    key={inst.id}
                    value={inst.name}
                    onSelect={() => {
                      onChange(inst.name);
                      setOpen(false);
                    }}
                  >
                    <RiCheckLine
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === inst.name ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {inst.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
