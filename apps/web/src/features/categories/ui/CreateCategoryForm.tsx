import { RiAddLine } from '@remixicon/react';
import type { CategoryResponse } from '@rumbo/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button, Input } from '@/shared/ui';

type CreateCategoryFormProps = {
  newName: string;
  onNameChange: (value: string) => void;
  selectedParentId: string | null;
  onParentChange: (value: string | null) => void;
  parentCategories: CategoryResponse[];
  onCreate: () => void;
  isCreating: boolean;
};

export function CreateCategoryForm({
  newName,
  onNameChange,
  selectedParentId,
  onParentChange,
  parentCategories,
  onCreate,
  isCreating,
}: CreateCategoryFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-sm font-medium">Nueva categoría</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Nombre de la categoría"
          value={newName}
          onChange={(e) => onNameChange(e.target.value)}
          className="flex-1"
        />
        <Select
          value={selectedParentId ?? 'none'}
          onValueChange={(value) => onParentChange(value === 'none' ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoría padre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin padre (raíz)</SelectItem>
            {parentCategories.map((parent) => (
              <SelectItem key={parent.id} value={parent.id}>
                {parent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={!newName.trim() || isCreating} size="sm">
          <RiAddLine className="h-4 w-4" />
          {isCreating ? 'Creando...' : 'Agregar'}
        </Button>
      </div>
    </form>
  );
}
