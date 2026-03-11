/**
 * Ads: session history of generated ads, persisted in localStorage.
 * Used by editor and by /projects page.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'riveads_library';

export interface Ad {
  id: string;
  createdAt: number;
  headline: string;
  subheadline: string;
  cta: string;
  colors: {
    background: string;
    primary: string;
    secondary: string;
    headlineColor?: string;
    subheadlineColor?: string;
    ctaColor?: string;
  };
  prompt: string;
  thumbnail?: string;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function loadFromStorage(): Ad[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is Ad =>
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
      .map((item) => ({
        ...item,
        chatHistory: item.chatHistory ?? (item as { conversationHistory?: typeof item.chatHistory }).conversationHistory,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function saveToStorage(ads: Ad[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
  } catch {
    // ignore
  }
}

export function useAds() {
  const [ads, setAds] = useState<Ad[]>(loadFromStorage);

  useEffect(() => {
    const stored = loadFromStorage();
    setAds(stored);
  }, []);

  const saveAd = useCallback((ad: Omit<Ad, 'id' | 'createdAt'>): string => {
    const id = crypto.randomUUID();
    const full: Ad = {
      ...ad,
      id,
      createdAt: Date.now(),
    };
    setAds((prev) => {
      const next = [full, ...prev];
      saveToStorage(next);
      return next;
    });
    return id;
  }, []);

  const updateItemThumbnail = useCallback((id: string, thumbnail: string) => {
    setAds((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, thumbnail } : item
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateItem = useCallback(
    (id: string, data: Omit<Ad, 'id' | 'createdAt'>) => {
      setAds((prev) => {
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
    setAds((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setAds([]);
    saveToStorage([]);
  }, []);

  return { items: ads, saveAd, updateItemThumbnail, updateItem, removeItem, clearAll };
}
