import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFolderLine,
  RiPriceTag3Line,
} from '@remixicon/react';
import type { CategoryResponse } from '@rumbo/shared';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, Input } from '@/shared/ui';
import { DefaultBadge } from './DefaultBadge';

type CategoryRowProps = {
  category: CategoryResponse;
  isEditing: boolean;
  editName: string;
  onEditNameChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRename: () => void;
  onDelete: () => void;
  isRenaming: boolean;
  isDeleting: boolean;
  isChild?: boolean;
};

export function CategoryRow({
  category,
  isEditing,
  editName,
  onEditNameChange,
  onStartEdit,
  onCancelEdit,
  onRename,
  onDelete,
  isRenaming,
  isDeleting,
  isChild,
}: CategoryRowProps) {
  const isDefault = category.isDefault;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRename();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50 ${
        isChild ? 'ml-6' : ''
      }`}
    >
      {isChild ? (
        <RiPriceTag3Line className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <RiFolderLine className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}

      {isEditing ? (
        <div className="flex flex-1 items-center gap-1.5">
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onRename}
            disabled={!editName.trim() || isRenaming}
            aria-label="Confirmar"
          >
            <RiCheckLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onCancelEdit}
            aria-label="Cancelar"
          >
            <RiCloseLine className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm">{category.name}</span>

          {isDefault && <DefaultBadge />}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onStartEdit}
            disabled={isDefault || isRenaming}
            aria-label={`Editar ${category.name}`}
          >
            <RiEditLine className="h-3.5 w-3.5" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={isDefault || isDeleting}
                aria-label={`Eliminar ${category.name}`}
              >
                <RiDeleteBinLine className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la categoría &quot;
                  {category.name}&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
