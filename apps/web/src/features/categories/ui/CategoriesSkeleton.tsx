import { Skeleton } from '@/shared/ui';

export function CategoriesSkeleton() {
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
