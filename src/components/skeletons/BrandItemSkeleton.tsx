interface BrandItemSkeletonProps {
  variant?: 'simple' | 'detailed';
}

export function BrandItemSkeleton({ variant = 'simple' }: BrandItemSkeletonProps) {
  if (variant === 'simple') {
    return (
      <div className="flex items-center justify-between gap-3 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
          </div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
          <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
