import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button, Input, Skeleton } from '@/shared/ui';
import type { CategoryGroup } from './useCategoriesPage';
import { useCategoriesPage } from './useCategoriesPage';

function CreateCategoryForm({
  newName,
  onNameChange,
  selectedParentId,
  onParentChange,
  parentCategories,
  onCreate,
  isCreating,
}: {
  newName: string;
  onNameChange: (value: string) => void;
  selectedParentId: string | null;
  onParentChange: (value: string | null) => void;
  parentCategories: CategoryResponse[];
  onCreate: () => void;
  isCreating: boolean;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-sm font-medium">Nueva categoria</h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Nombre de la categoria"
          value={newName}
          onChange={(e) => onNameChange(e.target.value)}
          className="flex-1"
        />
        <Select
          value={selectedParentId ?? 'none'}
          onValueChange={(value) => onParentChange(value === 'none' ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria padre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin padre (raiz)</SelectItem>
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

function CategoryRow({
  category,
  isEditing,
  editName,
  onEditNameChange,
  onStartEdit,
  onCancelEdit,
  onRename,
  onDelete,
  isRenaming,
  isChild,
}: {
  category: CategoryResponse;
  isEditing: boolean;
  editName: string;
  onEditNameChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRename: () => void;
  onDelete: () => void;
  isRenaming: boolean;
  isChild?: boolean;
}) {
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

          {isDefault && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Default
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onStartEdit}
            disabled={isDefault}
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
                disabled={isDefault}
                aria-label={`Eliminar ${category.name}`}
              >
                <RiDeleteBinLine className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar categoria</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion no se puede deshacer. Se eliminara permanentemente la categoria &quot;
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

function CategoryGroupSection({
  group,
  isExpanded,
  onToggle,
  editingId,
  editName,
  onEditNameChange,
  onStartEdit,
  onCancelEdit,
  onRename,
  onDelete,
  isRenaming,
}: {
  group: CategoryGroup;
  isExpanded: boolean;
  onToggle: () => void;
  editingId: string | null;
  editName: string;
  onEditNameChange: (value: string) => void;
  onStartEdit: (category: CategoryResponse) => void;
  onCancelEdit: () => void;
  onRename: () => void;
  onDelete: (id: string) => void;
  isRenaming: boolean;
}) {
  const { parent, children } = group;

  return (
    <div className="rounded-xl border border-border">
      {/* Parent header - clickable to expand/collapse */}
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-t-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
        onClick={onToggle}
      >
        {isExpanded ? (
          <RiArrowDownSLine className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <RiArrowRightSLine className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <RiFolderLine className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium">{parent.name}</span>
        {parent.isDefault && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Default
          </span>
        )}
        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {children.length}
        </span>
      </button>

      {/* Children list */}
      {isExpanded && children.length > 0 && (
        <div className="border-t border-border px-1 py-1">
          {children.map((child) => (
            <CategoryRow
              key={child.id}
              category={child}
              isEditing={editingId === child.id}
              editName={editName}
              onEditNameChange={onEditNameChange}
              onStartEdit={() => onStartEdit(child)}
              onCancelEdit={onCancelEdit}
              onRename={onRename}
              onDelete={() => onDelete(child.id)}
              isRenaming={isRenaming}
              isChild
            />
          ))}
        </div>
      )}

      {isExpanded && children.length === 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Sin subcategorias</p>
        </div>
      )}
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-10 rounded-xl" />
    </div>
  );
}

export function CategoriesPage() {
  const {
    groups,
    parentCategories,
    isPending,
    isError,
    newName,
    setNewName,
    selectedParentId,
    setSelectedParentId,
    handleCreate,
    isCreating,
    editingId,
    editName,
    setEditName,
    startEditing,
    cancelEditing,
    handleRename,
    isRenaming,
    handleDelete,
    toggleExpanded,
    isExpanded,
  } = useCategoriesPage();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-lg font-semibold mb-6">Categorias</h1>

      {/* Create category form */}
      <div className="mb-6 rounded-xl border border-border p-4">
        <CreateCategoryForm
          newName={newName}
          onNameChange={setNewName}
          selectedParentId={selectedParentId}
          onParentChange={setSelectedParentId}
          parentCategories={parentCategories}
          onCreate={handleCreate}
          isCreating={isCreating}
        />
      </div>

      {/* Categories list */}
      {isPending ? (
        <CategoriesSkeleton />
      ) : isError ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">Error al cargar las categorias</p>
          <p className="text-xs text-muted-foreground mt-1">
            Intenta recargar la pagina para volver a intentarlo
          </p>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">No hay categorias</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crea tu primera categoria usando el formulario de arriba
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <CategoryGroupSection
              key={group.parent.id}
              group={group}
              isExpanded={isExpanded(group.parent.id)}
              onToggle={() => toggleExpanded(group.parent.id)}
              editingId={editingId}
              editName={editName}
              onEditNameChange={setEditName}
              onStartEdit={startEditing}
              onCancelEdit={cancelEditing}
              onRename={handleRename}
              onDelete={handleDelete}
              isRenaming={isRenaming}
            />
          ))}
        </div>
      )}
    </div>
  );
}
