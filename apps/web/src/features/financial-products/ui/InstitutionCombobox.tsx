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

const groupedInstitutions = INSTITUTIONS.reduce<Record<string, (typeof INSTITUTIONS)[number][]>>(
  (acc, inst) => {
    const group = acc[inst.type];
    if (group) {
      group.push(inst);
    } else {
      acc[inst.type] = [inst];
    }
    return acc;
  },
  {},
);

export type InstitutionComboboxProps = {
  value: string;
  onChange: (value: string) => void;
};

export function InstitutionCombobox({ value, onChange }: InstitutionComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const isCustomValue = search.length > 0 && !INSTITUTIONS.some((i) => i.name === search);

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
          <CommandInput placeholder="Buscar institucion..." onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              <button
                type="button"
                className="cursor-pointer w-full px-2 py-1.5 text-left text-xs hover:bg-muted rounded-md"
                onClick={() => {
                  onChange(search);
                  setOpen(false);
                }}
              >
                Usar: <span className="font-medium">{search}</span>
              </button>
            </CommandEmpty>
            {isCustomValue && (
              <CommandGroup heading="Personalizado">
                <CommandItem
                  value={`custom-${search}`}
                  onSelect={() => {
                    onChange(search);
                    setOpen(false);
                  }}
                >
                  Usar: <span className="font-medium">{search}</span>
                </CommandItem>
              </CommandGroup>
            )}
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
