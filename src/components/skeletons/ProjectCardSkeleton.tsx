interface ProjectCardSkeletonProps {
  variant?: 'simple' | 'detailed';
}

export function ProjectCardSkeleton({ variant = 'simple' }: ProjectCardSkeletonProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col w-full">
      <div className="w-full h-[120px] flex-shrink-0 p-3 flex items-center justify-center bg-gray-50 box-border">
        <div className="w-full h-24 rounded-md bg-gray-200 animate-pulse" />
      </div>
      <div className="p-4 pb-3 flex flex-col flex-1 min-h-0">
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
        {variant === 'detailed' ? (
          <>
            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-3" />
            <div className="flex gap-1.5 mb-3">
              <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
            </div>
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
          </>
        ) : (
          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
        )}
      </div>
    </div>
  );
}
