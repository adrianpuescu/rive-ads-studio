/**
 * ShareModal — displays the shareable preview link with copy functionality.
 */

import { useEffect, useCallback, useState } from 'react';
import { X, Copy, Check, Link } from 'lucide-react';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  projectName: string;
}

export function ShareModal({ isOpen, onClose, shareUrl, projectName }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [shareUrl]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className="relative z-10 w-full max-w-md overflow-hidden flex flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <Link className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
            <h2 id="share-modal-title" className="text-base font-semibold text-gray-900 m-0 truncate">
              Share preview
            </h2>
          </div>
          <button
            type="button"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 bg-transparent border-0 rounded cursor-pointer hover:bg-gray-50 transition-colors duration-150"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </header>

        <div className="p-4 flex flex-col gap-4">
          <p className="text-sm text-gray-600 m-0">
            Anyone with this link can view <span className="font-medium text-gray-900">{projectName}</span>
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 min-w-0 px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded focus:outline-none"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 border-0 rounded cursor-pointer hover:bg-gray-700 transition-colors duration-150"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
