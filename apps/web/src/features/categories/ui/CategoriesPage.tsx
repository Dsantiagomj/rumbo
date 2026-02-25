import { CategoriesSkeleton } from './CategoriesSkeleton';
import { CategoryGroupSection } from './CategoryGroupSection';
import { CreateCategoryForm } from './CreateCategoryForm';
import { useCategoriesPage } from './useCategoriesPage';

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
    isDeleting,
    toggleExpanded,
    isExpanded,
  } = useCategoriesPage();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-lg font-semibold">Categorías</h1>

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
          <p className="text-sm text-muted-foreground">Error al cargar las categorías</p>
          <p className="text-xs text-muted-foreground mt-1">
            Intenta recargar la página para volver a intentarlo
          </p>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">No hay categorías</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crea tu primera categoría usando el formulario de arriba
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
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
