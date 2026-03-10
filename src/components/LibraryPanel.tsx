/**
 * Projects panel: drawer from the left listing saved ads.
 * Load restores an ad into the editor; Delete removes with inline confirm.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LibraryItem } from '../hooks/useLibrary';

export interface LibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: LibraryItem[];
  onLoad: (item: LibraryItem) => void;
  onRemove: (id: string) => void;
}

function formatTimestamp(createdAt: number): string {
  const diff = Date.now() - createdAt;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins === 1) return '1 minute ago';
  if (mins < 60) return `${mins} minutes ago`;
  const d = new Date(createdAt);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function truncatePrompt(prompt: string, maxLen: number): string {
  if (prompt.length <= maxLen) return prompt;
  return prompt.slice(0, maxLen).trim() + '…';
}

interface LibraryCardProps {
  item: LibraryItem;
  onLoad: (item: LibraryItem) => void;
  onRemove: (id: string) => void;
}

function LibraryCard({ item, onLoad, onRemove }: LibraryCardProps) {
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
    <div className="library-card">
      {item.thumbnail ? (
        <div className="library-card-thumbnail-wrap">
          <img
            src={item.thumbnail}
            alt=""
            className="library-card-thumbnail"
          />
        </div>
      ) : (
        <div
          className="library-card-preview-bar"
          style={{ background: item.colors.background }}
        />
      )}
      <div className="library-card-body">
        <div className="library-card-headline">{item.headline || '—'}</div>
        <div className="library-card-subheadline">{item.subheadline || '—'}</div>
        <div className="library-card-meta">
          {formatTimestamp(item.createdAt)}
        </div>
        <div className="library-card-prompt">
          {truncatePrompt(item.prompt, 60)}
        </div>
        <div className="library-card-actions">
          <button
            type="button"
            className="library-card-btn library-card-btn-load"
            onClick={() => onLoad(item)}
          >
            Load
          </button>
          {confirmDelete ? (
            <>
              <span className="library-card-confirm-label">Sure?</span>
              <button
                type="button"
                className="library-card-btn library-card-btn-confirm"
                onClick={handleDelete}
              >
                Yes
              </button>
              <button
                type="button"
                className="library-card-btn library-card-btn-cancel"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
            </>
          ) : (
            <button
              type="button"
              className="library-card-btn library-card-btn-delete"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LibraryPanel({
  isOpen,
  onClose,
  items,
  onLoad,
  onRemove,
}: LibraryPanelProps) {
  const navigate = useNavigate();
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  return (
    <div
      className={`library-panel ${isOpen ? 'library-panel-open' : ''}`}
      role="dialog"
      aria-label="Projects"
    >
      <div className="library-panel-header">
        <h2 className="library-panel-title">Projects</h2>
        <button
          type="button"
          className="library-panel-close"
          onClick={onClose}
          aria-label="Close projects"
        >
          ×
        </button>
      </div>
      <div className="library-panel-content">
        {items.length === 0 ? (
          <div className="library-empty">
            <span className="library-empty-icon" aria-hidden>
              🎨
            </span>
            <p className="library-empty-title">No ads yet</p>
            <p className="library-empty-sub">Generate your first ad to see it here</p>
          </div>
        ) : (
          <div className="library-grid">
            {items.map((item) => (
              <LibraryCard
                key={item.id}
                item={item}
                onLoad={onLoad}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>
      <footer className="library-panel-footer">
        <button
          type="button"
          className="library-panel-footer-link"
          onClick={() => {
            onClose();
            navigate('/projects');
          }}
        >
          View all projects →
        </button>
      </footer>
    </div>
  );
}
