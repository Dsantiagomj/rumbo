import { RiArrowDownSLine, RiSearchLine } from '@remixicon/react';
import { Input } from '@/shared/ui';

export function ProductsToolbar() {
  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar producto o institucion..."
          className="pl-9"
          disabled
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="Tipo" />
        <FilterChip label="Institucion" />
        <FilterChip label="Moneda" />
      </div>
    </div>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {label}
      <RiArrowDownSLine className="h-3.5 w-3.5" />
    </button>
  );
}
