import { RiCheckLine } from '@remixicon/react';
import type { UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type { CreateProductFormValues } from '../model/form-schemas';
import { useTypeSelector } from './useTypeSelector';

export function TypeSelector({ form }: { form: UseFormReturn<CreateProductFormValues> }) {
  const { selectedType, productGroups, typeLabels, handleTypeSelect } = useTypeSelector(form);

  return (
    <div className="space-y-6">
      {productGroups.map((group) => (
        <div key={group.key}>
          <div className="flex items-center gap-2 mb-3">
            <group.icon className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">{group.label}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.types.map((type) => {
              const isSelected = selectedType === type;
              const { label, description } = typeLabels[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeSelect(type)}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    {isSelected && <RiCheckLine className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
