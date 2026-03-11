/**
 * Reusable custom dropdown matching the Projects sort dropdown style.
 * Use instead of native <select> for consistent UI.
 */

import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectDropdownProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

export function SelectDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className={`relative ${className}`.trim()} ref={ref}>
      <button
        type="button"
        className="relative w-full text-sm py-2 pl-3 pr-8 border border-gray-200 rounded bg-white text-gray-900 cursor-pointer inline-flex items-center gap-2 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors duration-150 min-h-[32px] text-left"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="flex-1 truncate">{currentLabel}</span>
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          className="absolute top-[calc(100%+4px)] left-0 right-0 min-w-full m-0 p-1 list-none bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[240px] overflow-y-auto"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={value === opt.value}>
              <button
                type="button"
                className="flex items-center gap-2.5 w-full py-2 px-3 text-sm text-gray-900 bg-transparent border-0 rounded cursor-pointer text-left hover:bg-gray-50 transition-colors duration-150"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {value === opt.value && <span className="w-4 text-xs font-semibold text-gray-900 flex-shrink-0" aria-hidden>✓</span>}
                <span className="flex-1 truncate">{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
