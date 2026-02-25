import { RiArrowDownSLine, RiArrowRightSLine, RiFolderLine } from '@remixicon/react';
import type { CategoryResponse } from '@rumbo/shared';
import { CategoryRow } from './CategoryRow';
import { DefaultBadge } from './DefaultBadge';
import type { CategoryGroup } from './useCategoriesPage';

type CategoryGroupSectionProps = {
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
  isDeleting: boolean;
};

export function CategoryGroupSection({
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
  isDeleting,
}: CategoryGroupSectionProps) {
  const { parent, children } = group;
  const childrenId = `category-children-${parent.id}`;

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-t-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={childrenId}
      >
        {isExpanded ? (
          <RiArrowDownSLine className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <RiArrowRightSLine className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <RiFolderLine className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium">{parent.name}</span>
        {parent.isDefault && <DefaultBadge />}
        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {children.length}
        </span>
      </button>

      {isExpanded && children.length > 0 && (
        <div id={childrenId} className="border-t border-border px-1 py-1">
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
              isDeleting={isDeleting}
              isChild
            />
          ))}
        </div>
      )}

      {isExpanded && children.length === 0 && (
        <div id={childrenId} className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Sin subcategorías</p>
        </div>
      )}
    </div>
  );
}
