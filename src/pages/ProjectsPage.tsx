/**
 * Projects page at /projects.
 * Grid of saved ads with filters, sort, and "Open in Editor" (pending-load) flow.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useAds } from '../hooks/useAds';
import type { Ad } from '../hooks/useAds';
import { SelectDropdown } from '../components/SelectDropdown';
import { UserNavDropdown } from '../components/UserNavDropdown';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { ProjectCardSkeleton } from '../components/skeletons';

type SortByOption = 'last_modified' | 'date_created' | 'alphabetical';
type OrderOption = 'newest' | 'oldest';

const SORT_BY_OPTIONS: { value: SortByOption; label: string }[] = [
  { value: 'last_modified', label: 'Last modified' },
  { value: 'date_created', label: 'Date created' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

const ORDER_OPTIONS_DATE: { value: OrderOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const ORDER_OPTIONS_ALPHA: { value: OrderOption; label: string }[] = [
  { value: 'newest', label: 'A–Z' },
  { value: 'oldest', label: 'Z–A' },
];

function formatTimestamp(createdAt: number): string {
  const d = new Date(createdAt);
  return d.toLocaleString(undefined);
}

function promptSnippet(prompt: string, maxLen: number): string {
  if (prompt.length <= maxLen) return prompt;
  return prompt.slice(0, maxLen).trim() + '…';
}

interface AdCardProps {
  item: Ad;
  onClick: (item: Ad) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, newName: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<string | null>;
}

function AdCard({ item, onClick, onRemove, onRename, onDuplicate }: AdCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [renameValue, setRenameValue] = useState(item.headline || '');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const renameValueRef = useRef(renameValue);

  useEffect(() => {
    renameValueRef.current = renameValue;
  }, [renameValue]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  }, []);

  const handleRenameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    const initialValue = item.headline || '';
    setRenameValue(initialValue);
    setIsRenaming(true);
  }, [item.headline]);

  const handleRenameSubmit = useCallback(async () => {
    const currentValue = renameValueRef.current;
    const trimmed = currentValue.trim();
    if (trimmed && trimmed !== item.headline) {
      await onRename(item.id, trimmed);
    }
    setIsRenaming(false);
  }, [item.id, item.headline, onRename]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleRenameSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsRenaming(false);
      setRenameValue(item.headline || '');
    }
  }, [handleRenameSubmit, item.headline]);

  const handleRenameBlur = useCallback(() => {
    void handleRenameSubmit();
  }, [handleRenameSubmit]);

  const handleDuplicate = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    await onDuplicate(item.id);
  }, [item.id, onDuplicate]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsConfirmingDelete(true);
  }, []);

  const handleConfirmDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(item.id);
    setIsConfirmingDelete(false);
  }, [item.id, onRemove]);

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  }, []);

  const handleCardClick = useCallback(() => {
    if (isRenaming) return;
    onClick(item);
  }, [item, onClick, isRenaming]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isRenaming) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(item);
    }
  }, [item, onClick, isRenaming]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative border rounded-lg overflow-hidden bg-white flex flex-col w-full min-h-0 transition-all duration-150 text-left cursor-pointer ${isConfirmingDelete ? 'border-red-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
    >
      <div className="w-full h-[120px] flex-shrink-0 p-3 flex items-center justify-center bg-gray-50 box-border">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" className="max-w-full max-h-24 object-contain block rounded-md" />
        ) : (
          <div className="w-full h-24 rounded-md flex-shrink-0" style={{ background: item.colors.background }} />
        )}
      </div>
      <div className="p-4 pb-3 flex flex-col flex-1 min-h-0">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameBlur}
            onClick={(e) => e.stopPropagation()}
            className="text-base font-semibold text-gray-900 m-0 mb-1 leading-tight w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-500 bg-white"
          />
        ) : (
          <h3 className="text-base font-semibold text-gray-900 m-0 mb-1 leading-tight text-left">{item.headline || '—'}</h3>
        )}
        <p className="text-sm text-gray-500 m-0 mb-2 leading-tight text-left">{item.subheadline || '—'}</p>
        <p className="text-xs text-gray-400 italic m-0 mb-3 leading-tight text-left">{promptSnippet(item.prompt, 80)}</p>
        <div className="flex gap-1.5 mb-3" aria-hidden>
          <span className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ background: item.colors.background }} />
          <span className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ background: item.colors.primary }} />
          <span className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ background: item.colors.headlineColor ?? item.colors.primary }} />
        </div>
        <p className="text-xs text-gray-400 m-0 mb-3 text-left">{formatTimestamp(item.createdAt)}</p>
      </div>

      <div
        ref={menuRef}
        className={`absolute top-2 right-2 z-10 transition-opacity duration-150 ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <button
          type="button"
          onClick={handleMenuToggle}
          className="w-7 h-7 flex items-center justify-center rounded bg-white/90 border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition-colors duration-150"
          aria-label="More options"
        >
          <span className="text-base leading-none">⋯</span>
        </button>

        {menuOpen && (
          <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
            <button
              type="button"
              onClick={handleRenameClick}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-0 bg-transparent transition-colors duration-150"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-0 bg-transparent transition-colors duration-150"
            >
              Duplicate
            </button>
            <div className="h-px bg-gray-200 my-1" />
            <button
              type="button"
              onClick={handleDeleteClick}
              className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer border-0 bg-transparent transition-colors duration-150"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isConfirmingDelete && (
        <div
          className="absolute inset-0 rounded-lg bg-red-50/95 flex flex-col items-center justify-center gap-2 z-20"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Delete project?"
        >
          <span className="text-sm text-gray-600">Delete project?</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded border-0 cursor-pointer transition-colors duration-150"
              onClick={handleConfirmDelete}
            >
              Yes
            </button>
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 bg-transparent border-0 cursor-pointer transition-colors duration-150"
              onClick={handleCancelDelete}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const { items, loading, removeItem, renameItem, duplicateItem } = useAds();
  const [sortBy, setSortBy] = useState<SortByOption>('last_modified');
  const [order, setOrder] = useState<OrderOption>('newest');
  const [search, setSearch] = useState('');

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate('/login');
    }
  };

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
    const isAsc = order === 'newest';

    if (sortBy === 'last_modified') {
      list.sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : a.createdAt;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : b.createdAt;
        return isAsc ? bTime - aTime : aTime - bTime;
      });
    } else if (sortBy === 'date_created') {
      list.sort((a, b) => (isAsc ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));
    } else if (sortBy === 'alphabetical') {
      list.sort((a, b) => {
        const cmp = (a.headline || '').localeCompare(b.headline || '', undefined, { sensitivity: 'base' });
        return isAsc ? cmp : -cmp;
      });
    }
    return list;
  }, [filtered, sortBy, order]);

  const handleOpenInEditor = useCallback(
    (item: Ad) => {
      try {
        localStorage.setItem(STORAGE_KEYS.PENDING_LOAD, item.id);
      } catch {
        // ignore
      }
      navigate('/editor', { state: { pendingLoadItem: item } });
    },
    [navigate]
  );

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      <header className="h-11 flex-shrink-0 flex items-center py-0 px-5 bg-white border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center gap-1.5 no-underline text-gray-900">
          <span className="font-serif text-sm font-semibold leading-none">RiveAds</span>
          <span className="w-1 h-1 rounded-full bg-gray-900" aria-hidden />
          <span className="font-sans text-sm font-semibold leading-none">Studio</span>
        </Link>
        <div className="flex-1" />
        {user && (
          <UserNavDropdown
            user={user}
            displayName={profile?.displayName ?? null}
            onSignOut={handleSignOut}
          />
        )}
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

      {!loading && items.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-gray-500">
              Sort by
              <SelectDropdown
                className="min-w-[9rem]"
                value={sortBy}
                options={SORT_BY_OPTIONS}
                onChange={(v) => setSortBy(v as SortByOption)}
                ariaLabel="Sort by"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-500">
              Order
              <SelectDropdown
                className="min-w-[9rem]"
                value={order}
                options={sortBy === 'alphabetical' ? ORDER_OPTIONS_ALPHA : ORDER_OPTIONS_DATE}
                onChange={(v) => setOrder(v as OrderOption)}
                ariaLabel="Order"
              />
            </label>
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

      {loading ? (
        <div className="px-6 pt-4 pb-8">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 items-stretch">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} variant="detailed" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <h2 className="m-0 mb-2 text-base font-semibold text-gray-900">No projects yet</h2>
          <p className="m-0 mb-6 text-sm text-gray-500">Generate your first ad to get started.</p>
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
              <AdCard
                key={item.id}
                item={item}
                onClick={handleOpenInEditor}
                onRemove={removeItem}
                onRename={renameItem}
                onDuplicate={duplicateItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
