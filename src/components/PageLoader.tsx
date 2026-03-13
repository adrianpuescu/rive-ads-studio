interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading…' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative w-8 h-8">
          <div
            className="absolute inset-0 rounded-full border-2 border-gray-200"
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-gray-500 animate-spin"
            aria-hidden
          />
        </div>
        <p className="text-sm text-gray-500 m-0">{message}</p>
      </div>
    </div>
  );
}
