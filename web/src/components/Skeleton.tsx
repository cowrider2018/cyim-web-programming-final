/** Shimmer placeholders shown while data loads, sized to match the real content. */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-[var(--radius)] ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-square w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="mt-4 h-3.5 w-3/4" />
      <Skeleton className="mt-2 h-3.5 w-1/3" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-[var(--radius-lg)]" />
      <div className="space-y-5 pt-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
