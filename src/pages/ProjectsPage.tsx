/**
 * Projects page at /projects.
 * Grid of saved ads with filters, sort, and "Open in Editor" (pending-load) flow.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import type { LibraryItem } from '../hooks/useLibrary';

const PENDING_LOAD_KEY = 'riveads_pending_load';

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
      <label className="flex items-center gap-2 text-[0.85rem] text-text-secondary">
        Sort by
        <button
          type="button"
          className="relative font-sans text-[13px] py-2 pl-3 pr-8 border border-border rounded bg-white text-text-primary cursor-pointer inline-flex items-center gap-2 hover:bg-[#f9fafb] focus:outline-none focus:border-[#9ca3af] transition-colors duration-150"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Sort order"
        >
          {currentLabel}
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </label>
      {open && (
        <ul className="absolute top-[calc(100%+4px)] left-0 min-w-full m-0 p-1 list-none bg-white border border-border rounded-lg shadow-lg z-50" role="listbox" aria-label="Sort order">
          {SORT_OPTIONS.map((opt) => (
            <li key={opt.value} role="option" aria-selected={value === opt.value}>
              <button
                type="button"
                className="flex items-center gap-2.5 w-full py-2 px-3 font-sans text-[13px] text-text-primary bg-transparent border-0 rounded cursor-pointer text-left hover:bg-[#f3f4f6] transition-colors duration-150"
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {value === opt.value && <span className="w-4 text-xs font-semibold text-text-primary" aria-hidden>✓</span>}
                <span className="flex-1">{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface LibraryCardProps {
  item: LibraryItem;
  onOpenInEditor: (item: LibraryItem) => void;
  onRemove: (id: string) => void;
}

function LibraryCard({ item, onOpenInEditor, onRemove }: LibraryCardProps) {
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
    <article className={`group relative border border-border rounded-sm overflow-hidden bg-white flex flex-col w-full min-h-0 ${confirmDelete ? 'is-confirming' : ''}`}>
      <div className="w-full h-[120px] flex-shrink-0 p-3 flex items-center justify-center bg-[#f9fafb] box-border">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" className="max-w-full max-h-24 object-contain block rounded" />
        ) : (
          <div className="w-full h-24 rounded flex-shrink-0" style={{ background: item.colors.background }} />
        )}
      </div>
      <div className="p-4 pb-3 flex flex-col flex-1 min-h-0 bg-gradient-to-b from-transparent from-80% to-[rgba(249,250,251,0.4)] to-100%">
        <h3 className="font-bold text-base m-0 mb-1 leading-tight">{item.headline || '—'}</h3>
        <p className="text-[0.85rem] text-[#666] m-0 mb-2 leading-tight">{item.subheadline || '—'}</p>
        <p className="text-[0.75rem] text-[#999] italic m-0 mb-3 leading-tight">{promptSnippet(item.prompt, 80)}</p>
        <div className="flex gap-1.5 mb-3" aria-hidden>
          <span className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10" style={{ background: item.colors.background }} />
          <span className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10" style={{ background: item.colors.primary }} />
          <span className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10" style={{ background: item.colors.headlineColor ?? item.colors.primary }} />
        </div>
        <p className="text-[0.7rem] text-[#bbb] m-0 mb-3">{formatTimestamp(item.createdAt)}</p>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 flex flex-row items-center gap-2 py-5 px-4 pb-4 bg-gradient-to-b from-transparent from-0% via-white/88 via-[35%] to-white backdrop-blur-sm transition-all duration-250 ${confirmDelete ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2.5 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'}`}>
        {confirmDelete ? (
          <>
            <span className="text-[13px] text-text-secondary mr-1">Delete this ad?</span>
            <button type="button" className="font-sans text-[13px] py-2 px-3 rounded border border-[#fecaca] bg-[#fef2f2] text-error cursor-pointer hover:bg-[#fee2e2] transition-colors duration-150" onClick={handleDelete}>Yes</button>
            <button type="button" className="font-sans text-[13px] py-2 px-3 rounded border border-border bg-white text-text-primary cursor-pointer hover:bg-[#f9fafb] transition-colors duration-150 focus:outline-none" onClick={() => setConfirmDelete(false)}>No</button>
          </>
        ) : (
          <>
            <button type="button" className="flex-1 font-sans text-[13px] font-medium py-2 px-3 rounded bg-text-primary text-white border border-text-primary cursor-pointer hover:bg-[#374151] hover:border-[#374151] transition-colors duration-150" onClick={() => onOpenInEditor(item)}>Open in Editor</button>
            <button type="button" className="font-sans text-[13px] py-1.5 px-2.5 rounded text-text-secondary cursor-pointer hover:bg-[#fef2f2] transition-colors duration-150 focus:outline-none" onClick={handleDelete} aria-label="Delete ad"><span className="text-sm" aria-hidden>🗑</span></button>
          </>
        )}
      </div>
    </article>
  );
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const { items, removeItem } = useLibrary();
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
    (item: LibraryItem) => {
      try {
        localStorage.setItem(PENDING_LOAD_KEY, item.id);
      } catch {
        // ignore
      }
      navigate('/editor');
    },
    [navigate]
  );

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAFAFA]">
      <header className="h-11 flex-shrink-0 flex items-center justify-between py-0 px-5 gap-4 bg-white border-b border-[#e5e5e5]">
        <Link to="/" className="flex items-center gap-1.5 no-underline text-text-primary">
          <span className="font-serif text-lg leading-none">RiveAds</span>
          <span className="w-1 h-1 rounded-full bg-text-primary" aria-hidden />
          <span className="font-sans text-lg leading-none">Studio</span>
        </Link>
        <Link to="/editor" className="font-sans text-[13px] font-medium text-text-secondary no-underline py-1.5 px-2.5 -mr-1 border-0 rounded bg-transparent cursor-pointer hover:text-text-primary hover:bg-[#f3f4f6] transition-colors duration-150">
          Editor
        </Link>
      </header>

      <section className="py-6 px-6 pb-2">
        <h1 className="font-sans font-bold text-2xl text-text-primary m-0">Projects</h1>
      </section>

      {items.length > 0 && (
        <div className="px-6 pb-2">
          <div className="flex items-center gap-4 flex-wrap">
            <SortDropdown value={sort} onChange={setSort} />
            <input
              type="search"
              className="flex-1 min-w-[200px] font-sans text-[13px] py-2 px-3 border border-border rounded bg-white text-text-primary placeholder-[#9ca3af] hover:bg-[#f9fafb] focus:outline-none focus:border-[#9ca3af] transition-colors duration-150"
              placeholder="Search headline or prompt…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search projects"
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
          <span className="text-6xl leading-none mb-4" aria-hidden>🎨</span>
          <h2 className="m-0 mb-2 font-sans font-semibold text-xl text-text-primary">No ads yet</h2>
          <p className="m-0 mb-6 text-[0.9rem] text-text-secondary">Go to the editor and generate your first ad</p>
          <Link to="/editor" className="font-sans font-medium text-[13px] py-2 px-3.5 rounded border border-text-primary bg-text-primary text-white no-underline inline-flex items-center justify-center hover:bg-[#374151] hover:border-[#374151] transition-colors duration-150">
            Open Editor
          </Link>
        </div>
      ) : (
        <div className="px-6 pt-4">
          <p className="m-0 mb-3 text-[0.8rem] text-text-secondary">Showing {sorted.length} of {items.length} projects</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 items-stretch">
          {sorted.map((item) => (
            <LibraryCard key={item.id} item={item} onOpenInEditor={handleOpenInEditor} onRemove={removeItem} />
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
