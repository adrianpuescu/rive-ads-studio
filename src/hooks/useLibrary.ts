/**
 * Creative Library: session history of generated ads, persisted in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'riveads_library';

export interface LibraryItem {
  id: string;
  createdAt: number;
  headline: string;
  subheadline: string;
  cta: string;
  colors: {
    background: string;
    primary: string;
    secondary: string;
    /** Headline text color (hex). Optional for older items. */
    headlineColor?: string;
    /** Subheadline text color (hex). Optional for older items. */
    subheadlineColor?: string;
    /** CTA text color (hex). Optional for older items. */
    ctaColor?: string;
  };
  prompt: string;
  /** base64 JPEG, optional (missing for older items) */
  thumbnail?: string;
  /** Chat messages at save time (optional for older items) */
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function loadFromStorage(): LibraryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is LibraryItem =>
          typeof x?.id === 'string' &&
          typeof x?.createdAt === 'number' &&
          typeof x?.headline === 'string' &&
          typeof x?.subheadline === 'string' &&
          typeof x?.cta === 'string' &&
          x?.colors != null &&
          typeof (x.colors as { background?: string })?.background === 'string' &&
          typeof (x.colors as { primary?: string })?.primary === 'string' &&
          typeof (x.colors as { secondary?: string })?.secondary === 'string' &&
          typeof x?.prompt === 'string'
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function saveToStorage(items: LibraryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>(loadFromStorage);

  useEffect(() => {
    const stored = loadFromStorage();
    setItems(stored);
  }, []);

  const addItem = useCallback((item: Omit<LibraryItem, 'id' | 'createdAt'>): string => {
    const id = crypto.randomUUID();
    const full: LibraryItem = {
      ...item,
      id,
      createdAt: Date.now(),
    };
    setItems((prev) => {
      const next = [full, ...prev];
      saveToStorage(next);
      return next;
    });
    return id;
  }, []);

  const updateItemThumbnail = useCallback((id: string, thumbnail: string) => {
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, thumbnail } : item
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  /** Updates an existing item's spec fields (headline, subheadline, cta, colors, prompt). Keeps id, createdAt, thumbnail, chatHistory. */
  const updateItem = useCallback(
    (id: string, data: Omit<LibraryItem, 'id' | 'createdAt'>) => {
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                headline: data.headline,
                subheadline: data.subheadline,
                cta: data.cta,
                colors: data.colors,
                prompt: data.prompt,
                chatHistory: data.chatHistory ?? item.chatHistory,
              }
            : item
        );
        saveToStorage(next);
        return next;
      });
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    saveToStorage([]);
  }, []);

  return { items, addItem, updateItemThumbnail, updateItem, removeItem, clearAll };
}
