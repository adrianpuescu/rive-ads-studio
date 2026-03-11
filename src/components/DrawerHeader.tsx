/**
 * Shared header for drawer panels (Projects, Brands, New/Edit Brand form).
 * Layout: title left (or back + title center when back is set), optional action + close right.
 */

export interface DrawerHeaderProps {
  title: string;
  onClose: () => void;
  /** Left-side back link (e.g. form "← Back"). When set, title is centered. */
  back?: { label: string; onClick: () => void };
  /** Right-side primary action (e.g. "+ New brand"). */
  action?: { label: string; onClick: () => void };
}

export function DrawerHeader({ title, onClose, back, action }: DrawerHeaderProps) {
  const closeButton = (
    <button
      type="button"
      className="text-gray-400 hover:text-gray-900 text-lg leading-none px-1 py-0 bg-transparent border-0 cursor-pointer transition-colors"
      onClick={onClose}
      aria-label="Close"
    >
      ×
    </button>
  );

  return (
    <header className="flex items-center justify-between flex-shrink-0 border-b border-gray-200 px-4 min-h-12">
      {back ? (
        <>
          <div className="min-w-16 flex justify-start">
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-900 bg-transparent border-0 cursor-pointer transition-colors py-1 -ml-1"
              onClick={back.onClick}
              aria-label="Back"
            >
              {back.label}
            </button>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 m-0 flex-1 text-center truncate px-2">{title}</h2>
          <div className="min-w-16 flex justify-end">{closeButton}</div>
        </>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-gray-900 m-0">{title}</h2>
          <div className="flex gap-2 items-center">
            {action && (
              <button
                type="button"
                className="text-sm px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 bg-white cursor-pointer transition-colors leading-none"
                onClick={action.onClick}
              >
                {action.label}
              </button>
            )}
            {action && <span className="text-gray-300" aria-hidden>·</span>}
            {closeButton}
          </div>
        </>
      )}
    </header>
  );
}
