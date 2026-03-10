/**
 * Projects page at /projects.
 * Grid of saved ads with filters, sort, and "Open in Editor" (pending-load) flow.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import type { LibraryItem } from '../hooks/useLibrary';
import './LibraryPage.css';

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
    <div className="library-page-sort-wrap" ref={ref}>
      <label className="library-page-filter-label">
        Sort by
        <button
          type="button"
          className="library-page-select"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Sort order"
        >
          {currentLabel}
          <span className="library-page-select-chevron" aria-hidden />
        </button>
      </label>
      {open && (
        <ul
          className="library-page-sort-dropdown"
          role="listbox"
          aria-label="Sort order"
        >
          {SORT_OPTIONS.map((opt) => (
            <li key={opt.value} role="option" aria-selected={value === opt.value}>
              <button
                type="button"
                className="library-page-sort-option"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {value === opt.value && (
                  <span className="library-page-sort-check" aria-hidden>✓</span>
                )}
                <span className="library-page-sort-option-label">{opt.label}</span>
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
    <article
      className={`library-page-card ${confirmDelete ? 'library-page-card-is-confirming' : ''}`}
    >
      <div className="library-page-card-thumb-wrap">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            className="library-page-card-thumb"
          />
        ) : (
          <div
            className="library-page-card-thumb-fallback"
            style={{ background: item.colors.background }}
          />
        )}
      </div>
      <div className="library-page-card-body">
        <h3 className="library-page-card-headline">{item.headline || '—'}</h3>
        <p className="library-page-card-subheadline">{item.subheadline || '—'}</p>
        <p className="library-page-card-prompt">
          {promptSnippet(item.prompt, 80)}
        </p>
        <div className="library-page-card-dots" aria-hidden>
          <span
            className="library-page-card-dot"
            style={{ background: item.colors.background }}
          />
          <span
            className="library-page-card-dot"
            style={{ background: item.colors.primary }}
          />
          <span
            className="library-page-card-dot"
            style={{
              background: item.colors.headlineColor ?? item.colors.primary,
            }}
          />
        </div>
        <p className="library-page-card-time">{formatTimestamp(item.createdAt)}</p>
      </div>
      <div className="library-page-card-actions">
        {confirmDelete ? (
          <>
            <span className="library-page-card-confirm">Delete this ad?</span>
            <button
              type="button"
              className="library-page-card-btn library-page-card-btn-confirm"
              onClick={handleDelete}
            >
              Yes
            </button>
            <button
              type="button"
              className="library-page-card-btn library-page-card-btn-cancel"
              onClick={() => setConfirmDelete(false)}
            >
              No
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="library-page-card-btn library-page-card-btn-primary"
              onClick={() => onOpenInEditor(item)}
            >
              Open in Editor
            </button>
            <button
              type="button"
              className="library-page-card-btn library-page-card-btn-delete"
              onClick={handleDelete}
              aria-label="Delete ad"
            >
              <span className="library-page-card-trash" aria-hidden>🗑</span>
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const { items, clearAll, removeItem } = useLibrary();
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');
  const [clearConfirm, setClearConfirm] = useState(false);

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

  const handleClearAll = useCallback(() => {
    if (clearConfirm) {
      clearAll();
      setClearConfirm(false);
    } else {
      setClearConfirm(true);
    }
  }, [clearConfirm, clearAll]);

  return (
    <div className="library-page">
      <header className="library-page-header">
        <Link to="/" className="library-page-wordmark">
          <span className="library-page-wordmark-riveads">RiveAds</span>
          <span className="library-page-wordmark-dot" aria-hidden />
          <span className="library-page-wordmark-studio">Studio</span>
        </Link>
        <Link to="/editor" className="library-page-back">
          Editor
        </Link>
      </header>

      <section className="library-page-hero">
        <div className="library-page-hero-left">
          <h1 className="library-page-title">Projects</h1>
          <p className="library-page-subtitle">
            {items.length === 1 ? '1 ad saved' : `${items.length} ads saved`}
          </p>
        </div>
        <div className="library-page-hero-right">
          {items.length > 0 &&
            (clearConfirm ? (
              <>
                <span className="library-page-clear-confirm">Clear all?</span>
                <button
                  type="button"
                  className="library-page-btn library-page-btn-clear-confirm"
                  onClick={handleClearAll}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="library-page-btn library-page-btn-clear-cancel"
                  onClick={() => setClearConfirm(false)}
                >
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                className="library-page-btn library-page-btn-clear"
                onClick={handleClearAll}
              >
                Clear All
              </button>
            ))}
        </div>
      </section>

      {items.length > 0 && (
        <div className="library-page-filters">
          <div className="library-page-filters-row">
            <SortDropdown value={sort} onChange={setSort} />
            <input
              type="search"
              className="library-page-search"
              placeholder="Search headline or prompt…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search ads"
            />
          </div>
          <p className="library-page-results">
            Showing {sorted.length} of {items.length} ads
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="library-page-empty">
          <span className="library-page-empty-icon" aria-hidden>
            🎨
          </span>
          <h2 className="library-page-empty-title">No ads yet</h2>
          <p className="library-page-empty-sub">
            Go to the editor and generate your first ad
          </p>
          <Link to="/editor" className="library-page-btn library-page-btn-editor">
            Open Editor
          </Link>
        </div>
      ) : (
        <div className="library-page-grid">
          {sorted.map((item) => (
            <LibraryCard
              key={item.id}
              item={item}
              onOpenInEditor={handleOpenInEditor}
              onRemove={removeItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
