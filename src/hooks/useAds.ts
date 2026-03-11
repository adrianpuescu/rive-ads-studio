/**
 * Ads: session history of generated ads, persisted in localStorage.
 * Used by editor and by /projects page.
 */

import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';

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

type AdLike = Ad & { conversationHistory?: Ad['chatHistory'] };

function getChatHistoryFromItem(item: AdLike): Ad['chatHistory'] {
  if (item.chatHistory && Array.isArray(item.chatHistory)) return item.chatHistory;
  if (item.conversationHistory && Array.isArray(item.conversationHistory)) return item.conversationHistory;
  return undefined;
}

function rawFromStorage(): string | null {
  return (
    localStorage.getItem(STORAGE_KEYS.ADS) ||
    localStorage.getItem('riveads_library') ||
    localStorage.getItem('riveads_ads') ||
    null
  );
}

function loadFromStorage(): Ad[] {
  try {
    const raw = rawFromStorage();
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    let needsMigrate = false;
    const normalized = parsed
      .filter(
        (x): x is AdLike =>
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
      .map((item) => {
        const chatHistory = getChatHistoryFromItem(item);
        if ((item as AdLike).conversationHistory !== undefined) needsMigrate = true;
        const { conversationHistory: _drop, ...rest } = item as AdLike & { conversationHistory?: unknown };
        return { ...rest, chatHistory } as Ad;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    if (needsMigrate && normalized.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.ADS, JSON.stringify(normalized));
      } catch {
        // ignore migration write failure
      }
    }
    return normalized;
  } catch {
    return [];
  }
}

function saveToStorage(ads: Ad[]): void {
  try {
    console.log('[useAds] saveToStorage — ads count:', ads.length, 'each chatHistory length:', ads.map((a) => a.chatHistory?.length ?? 0));
    localStorage.setItem(STORAGE_KEYS.ADS, JSON.stringify(ads));
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
