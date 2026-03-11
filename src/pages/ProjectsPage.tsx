/**
 * Projects page at /projects.
 * Grid of saved ads with filters, sort, and "Open in Editor" (pending-load) flow.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAds } from '../hooks/useAds';
import type { Ad } from '../hooks/useAds';

import { STORAGE_KEYS } from '../constants/storageKeys';

type SortOption = 'newest' | 'oldest' | 'name';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name (A–Z)' },
];

function formatTimestamp(createdAt: number): string {
  const d = new Date(createdAt);
  return d.toLocaleString(undefined);
}

function promptSnippet(prompt: string, maxLen: number): string {
  if (prompt.length <= maxLen) return prompt;
  return prompt.slice(0, maxLen).trim() + '…';
}

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

function SortDropdown({ value, onChange }: SortDropdownProps) {
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

  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="relative" ref={ref}>
      <label className="flex items-center gap-2 text-sm text-gray-500">
        Sort by
        <button
          type="button"
          className="relative text-sm py-2 pl-3 pr-8 border border-gray-200 rounded bg-white text-gray-900 cursor-pointer inline-flex items-center gap-2 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors duration-150 min-h-[32px]"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Sort order"
        >
          {currentLabel}
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </label>
      {open && (
        <ul className="absolute top-[calc(100%+4px)] left-0 min-w-full m-0 p-1 list-none bg-white border border-gray-200 rounded-lg shadow-lg z-50" role="listbox" aria-label="Sort order">
          {SORT_OPTIONS.map((opt) => (
            <li key={opt.value} role="option" aria-selected={value === opt.value}>
              <button
                type="button"
                className="flex items-center gap-2.5 w-full py-2 px-3 text-sm text-gray-900 bg-transparent border-0 rounded cursor-pointer text-left hover:bg-gray-50 transition-colors duration-150"
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {value === opt.value && <span className="w-4 text-xs font-semibold text-gray-900" aria-hidden>✓</span>}
                <span className="flex-1">{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface AdCardProps {
  item: Ad;
  onOpenInEditor: (item: Ad) => void;
  onRemove: (id: string) => void;
}

function AdCard({ item, onOpenInEditor, onRemove }: AdCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = useCallback(() => {
    if (confirmDelete) {
      onRemove(item.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  }, [confirmDelete, item.id, onRemove]);

  return (
    <article className={`group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 hover:shadow-sm flex flex-col w-full min-h-0 transition-all duration-150 ${confirmDelete ? 'is-confirming' : ''}`}>
      <div className="w-full h-[120px] flex-shrink-0 p-3 flex items-center justify-center bg-gray-50 box-border">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" className="max-w-full max-h-24 object-contain block rounded-md" />
        ) : (
          <div className="w-full h-24 rounded-md flex-shrink-0" style={{ background: item.colors.background }} />
        )}
      </div>
      <div className="p-4 pb-3 flex flex-col flex-1 min-h-0">
        <h3 className="text-base font-semibold text-gray-900 m-0 mb-1 leading-tight">{item.headline || '—'}</h3>
        <p className="text-sm text-gray-500 m-0 mb-2 leading-tight">{item.subheadline || '—'}</p>
        <p className="text-xs text-gray-400 italic m-0 mb-3 leading-tight">{promptSnippet(item.prompt, 80)}</p>
        <div className="flex gap-1.5 mb-3" aria-hidden>
          <span className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ background: item.colors.background }} />
          <span className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ background: item.colors.primary }} />
          <span className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ background: item.colors.headlineColor ?? item.colors.primary }} />
        </div>
        <p className="text-xs text-gray-400 m-0 mb-3">{formatTimestamp(item.createdAt)}</p>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 flex flex-row items-center gap-2 py-5 px-4 pb-4 bg-gradient-to-b from-transparent from-0% via-white/88 via-[35%] to-white backdrop-blur-sm transition-all duration-250 ${confirmDelete ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2.5 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'}`}>
        {confirmDelete ? (
          <>
            <span className="text-sm text-gray-500 mr-1">Delete this ad?</span>
            <button type="button" className="text-sm py-2 px-3 rounded border border-red-200 bg-red-50 text-red-500 cursor-pointer hover:bg-red-100 transition-colors duration-150 min-h-[32px]" onClick={handleDelete}>Yes</button>
            <button type="button" className="text-sm py-2 px-3 rounded border border-gray-200 bg-white text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors duration-150 focus:outline-none min-h-[32px]" onClick={() => setConfirmDelete(false)}>No</button>
          </>
        ) : (
          <>
            <button type="button" className="flex-1 text-sm font-medium py-2 px-3 rounded bg-gray-900 text-white border-0 cursor-pointer hover:bg-gray-700 transition-colors duration-150 min-h-[32px]" onClick={() => onOpenInEditor(item)}>Open in Editor</button>
            <button type="button" className="text-sm text-gray-400 py-1.5 px-2.5 rounded cursor-pointer hover:text-red-500 transition-colors duration-150 focus:outline-none bg-transparent border-0" onClick={handleDelete} aria-label="Delete ad">Delete</button>
          </>
        )}
      </div>
    </article>
  );
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const { items, removeItem } = useAds();
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.headline.toLowerCase().includes(q) ||
        item.subheadline.toLowerCase().includes(q) ||
        item.prompt.toLowerCase().includes(q)
    );
  }, [items, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === 'oldest') {
      list.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sort === 'name') {
      list.sort((a, b) =>
        (a.headline || '').localeCompare(b.headline || '', undefined, { sensitivity: 'base' })
      );
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }, [filtered, sort]);

  const handleOpenInEditor = useCallback(
    (item: Ad) => {
      try {
        localStorage.setItem(STORAGE_KEYS.PENDING_LOAD, item.id);
      } catch {
        // ignore
      }
      navigate('/editor');
    },
    [navigate]
  );

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      <header className="h-11 flex-shrink-0 flex items-center py-0 px-5 bg-white border-b border-gray-200">
        <Link to="/" className="flex items-center gap-1.5 no-underline text-gray-900">
          <span className="font-serif text-sm font-semibold leading-none">RiveAds</span>
          <span className="w-1 h-1 rounded-full bg-gray-900" aria-hidden />
          <span className="font-sans text-sm font-semibold leading-none">Studio</span>
        </Link>
      </header>

      <section className="pt-8 px-6 pb-6 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-base font-semibold text-gray-900 m-0">Projects</h1>
        <button
          type="button"
          onClick={() => navigate('/editor')}
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3 py-2 rounded hover:bg-gray-700 border-0 cursor-pointer transition-colors duration-150 min-h-[32px]"
        >
          New Project
        </button>
      </section>

      {items.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <SortDropdown value={sort} onChange={setSort} />
            <input
              type="search"
              className="flex-1 min-w-[200px] border border-gray-200 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors duration-150"
              placeholder="Search headline or prompt…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search projects"
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <h2 className="m-0 mb-2 text-base font-semibold text-gray-900">No ads yet</h2>
          <p className="m-0 mb-6 text-sm text-gray-500">Go to the editor and generate your first ad</p>
          <button
            type="button"
            onClick={() => navigate('/editor')}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3 py-2 rounded hover:bg-gray-700 border-0 cursor-pointer transition-colors duration-150 min-h-[32px]"
          >
            Open Editor
          </button>
        </div>
      ) : (
        <div className="px-6 pt-4 pb-8">
          <p className="m-0 mb-3 text-xs text-gray-400">Showing {sorted.length} of {items.length} projects</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 items-stretch">
            {sorted.map((item) => (
              <AdCard key={item.id} item={item} onOpenInEditor={handleOpenInEditor} onRemove={removeItem} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
