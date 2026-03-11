/**
 * Ads drawer: panel from the left listing saved ads (Projects container).
 * Load restores an ad into the editor; Delete removes with inline confirm.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrawerHeader } from './DrawerHeader';
import type { Ad } from '../hooks/useAds';

export interface AdsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Ad[];
  onLoad: (item: Ad) => void;
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

interface AdCardProps {
  item: Ad;
  onLoad: (item: Ad) => void;
  onRemove: (id: string) => void;
}

function AdCard({ item, onLoad, onRemove }: AdCardProps) {
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
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-150">
      {item.thumbnail ? (
        <div className="p-2 bg-gray-50 rounded-t-lg overflow-hidden">
          <img src={item.thumbnail} alt="" className="w-full h-auto object-contain block rounded-md" />
        </div>
      ) : (
        <div className="h-1.5 w-full" style={{ background: item.colors.background }} />
      )}
      <div className="p-4">
        <div className="text-sm font-semibold text-gray-900 mb-1">{item.headline || '—'}</div>
        <div className="text-sm text-gray-500 mb-1">{item.subheadline || '—'}</div>
        <div className="text-xs text-gray-400 mb-1">{formatTimestamp(item.createdAt)}</div>
        <div className="text-xs text-gray-400 italic mb-3">{truncatePrompt(item.prompt, 60)}</div>
        <div className="flex flex-row gap-2 items-center">
          <button
            type="button"
            className="py-1.5 px-3 text-sm border border-gray-200 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px]"
            onClick={() => onLoad(item)}
          >
            Load
          </button>
          {confirmDelete ? (
            <>
              <span className="text-xs text-gray-500 mr-1">Sure?</span>
              <button
                type="button"
                className="py-1.5 px-3 text-sm border border-red-200 bg-red-50 text-red-500 rounded hover:bg-red-100 cursor-pointer transition-colors duration-150 min-h-[32px]"
                onClick={handleDelete}
              >
                Yes
              </button>
              <button
                type="button"
                className="py-1.5 px-3 text-sm border border-gray-200 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px]"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
            </>
          ) : (
            <button
              type="button"
              className="text-sm text-gray-400 hover:text-red-500 px-2 py-1 cursor-pointer bg-transparent border-0 transition-colors duration-150"
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

export function AdsDrawer({
  isOpen,
  onClose,
  items,
  onLoad,
  onRemove,
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
              <AdCard key={item.id} item={item} onLoad={onLoad} onRemove={onRemove} />
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
