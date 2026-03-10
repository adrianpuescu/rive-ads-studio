/**
 * Brand Tokens: visual brand values (colors, font) used by AI in every generation.
 * Persisted in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import type { BrandTokens } from '../types/brand-tokens';

const STORAGE_KEY = 'riveads_brand_tokens';

export type { BrandTokens };

function loadFromStorage(): BrandTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== 'object') return null;
    const o = parsed as Record<string, unknown>;
    if (
      typeof o.primaryColor !== 'string' ||
      typeof o.secondaryColor !== 'string' ||
      typeof o.backgroundColor !== 'string' ||
      typeof o.fontFamily !== 'string' ||
      typeof o.brandName !== 'string' ||
      typeof o.brandVoice !== 'string'
    ) {
      return null;
    }
    return {
      primaryColor: o.primaryColor,
      secondaryColor: o.secondaryColor,
      backgroundColor: o.backgroundColor,
      fontFamily: o.fontFamily,
      brandName: o.brandName,
      brandVoice: o.brandVoice,
    };
  } catch {
    return null;
  }
}

function saveToStorage(tokens: BrandTokens | null): void {
  try {
    if (tokens === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    }
  } catch {
    // ignore
  }
}

export function useBrandTokens() {
  const [tokens, setTokensState] = useState<BrandTokens | null>(loadFromStorage);

  useEffect(() => {
    setTokensState(loadFromStorage());
  }, []);

  const setTokens = useCallback((next: BrandTokens) => {
    setTokensState(next);
    saveToStorage(next);
  }, []);

  const clearTokens = useCallback(() => {
    setTokensState(null);
    saveToStorage(null);
  }, []);

  const hasTokens = tokens !== null;

  return { tokens, setTokens, clearTokens, hasTokens };
}
