/**
 * Ads drawer: panel from the left listing saved ads (Projects container).
 * Clicking the card loads the project; ⋯ menu offers Rename, Duplicate, Delete.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrawerHeader } from './DrawerHeader';
import type { Ad } from '../hooks/useAds';

export interface AdsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Ad[];
  onLoad: (item: Ad) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, newName: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<string | null>;
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

interface AdCardProps {
  item: Ad;
  onLoad: (item: Ad) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, newName: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<string | null>;
}

function AdCard({ item, onLoad, onRemove, onRename, onDuplicate }: AdCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    setConfirmDelete(true);
  }, []);

  const handleConfirmDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(item.id);
    setConfirmDelete(false);
  }, [item.id, onRemove]);

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  }, []);

  const handleCardClick = useCallback(() => {
    if (isRenaming) return;
    onLoad(item);
  }, [item, onLoad, isRenaming]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isRenaming) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onLoad(item);
    }
  }, [item, onLoad, isRenaming]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative border rounded-lg overflow-hidden bg-white transition-all duration-150 text-left cursor-pointer ${confirmDelete ? 'border-red-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
    >
      {item.thumbnail ? (
        <div className="p-2 bg-gray-50 rounded-t-lg overflow-hidden">
          <img src={item.thumbnail} alt="" className="w-full h-auto object-contain block rounded-md" />
        </div>
      ) : (
        <div className="h-1.5 w-full" style={{ background: item.colors.background }} />
      )}
      <div className="p-4">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameBlur}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-gray-900 mb-1 leading-tight w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-500 bg-white"
          />
        ) : (
          <div className="text-sm font-semibold text-gray-900 mb-1">{item.headline || '—'}</div>
        )}
        <div className="text-sm text-gray-500 mb-1">{item.subheadline || '—'}</div>
        <div className="text-xs text-gray-400 mb-1">{formatTimestamp(item.createdAt)}</div>
        <div className="text-xs text-gray-400 italic">{truncatePrompt(item.prompt, 60)}</div>
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

      {confirmDelete && (
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

export function AdsDrawer({
  isOpen,
  onClose,
  items,
  onLoad,
  onRemove,
  onRename,
  onDuplicate,
}: AdsDrawerProps) {
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
      className={`absolute left-0 top-0 w-[300px] h-full z-20 bg-white border-r border-gray-200 flex flex-col transition-transform duration-250 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-[300px]'}`}
      role="dialog"
      aria-label="Projects"
    >
      <DrawerHeader title="Projects" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-thin">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <p className="text-sm font-semibold text-gray-900 m-0 mb-1">No ads yet</p>
            <p className="text-sm text-gray-500 m-0">Generate your first ad to see it here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {items.map((item) => (
              <AdCard key={item.id} item={item} onLoad={onLoad} onRemove={onRemove} onRename={onRename} onDuplicate={onDuplicate} />
            ))}
          </div>
        )}
      </div>
      <footer className="flex-shrink-0 px-4 py-3 border-t border-gray-200">
        <button
          type="button"
          className="text-sm text-gray-900 bg-transparent border-0 p-0 cursor-pointer leading-inherit hover:underline"
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
