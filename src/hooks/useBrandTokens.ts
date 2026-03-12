/**
 * Brand Manager: multiple brands with tokens; one active brand used in AI prompts.
 * Persisted in localStorage as BrandState.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { BrandTokens } from '../types/brand-tokens';
import { STORAGE_KEYS } from '../constants/storageKeys';

export interface Brand {
  id: string;
  name: string;
  createdAt: number;
  tokens: BrandTokens;
}

export interface BrandState {
  brands: Brand[];
  activeBrandId: string | null;
}

function loadFromStorage(): BrandState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BRAND_STATE);
    if (!raw) return { brands: [], activeBrandId: null };
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== 'object') return { brands: [], activeBrandId: null };
    const o = parsed as Record<string, unknown>;
    const brands = parseBrands(o.brands);
    let activeBrandId = typeof o.activeBrandId === 'string' ? o.activeBrandId : null;
    const isEnabled = typeof o.isEnabled === 'boolean' ? o.isEnabled : true;
    if (!isEnabled) activeBrandId = null;
    return { brands, activeBrandId };
  } catch {
    return { brands: [], activeBrandId: null };
  }
}

function parseBrands(value: unknown): Brand[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is Brand => {
    if (x == null || typeof x !== 'object') return false;
    const b = x as Record<string, unknown>;
    if (typeof b.id !== 'string' || typeof b.name !== 'string' || typeof b.createdAt !== 'number') return false;
    const t = b.tokens;
    if (t == null || typeof t !== 'object') return false;
    const tok = t as Record<string, unknown>;
    return (
      typeof tok.primaryColor === 'string' &&
      typeof tok.secondaryColor === 'string' &&
      typeof tok.backgroundColor === 'string' &&
      typeof tok.fontFamily === 'string' &&
      typeof tok.brandVoice === 'string'
    );
  }).map((x) => ({
    id: (x as Brand).id,
    name: (x as Brand).name,
    createdAt: (x as Brand).createdAt,
    tokens: { ...(x as Brand).tokens },
  }));
}

function saveToStorage(state: BrandState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BRAND_STATE, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useBrandTokens() {
  const [state, setState] = useState<BrandState>(loadFromStorage);

  useEffect(() => {
    setState(loadFromStorage());
  }, []);

  const activeBrand = useMemo(
    () => (state.activeBrandId ? state.brands.find((b) => b.id === state.activeBrandId) ?? null : null),
    [state.brands, state.activeBrandId]
  );

  const hasActiveBrand = state.activeBrandId !== null;

  const addBrand = useCallback((name: string, tokens: BrandTokens): Brand => {
    const brand: Brand = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Unnamed',
      createdAt: Date.now(),
      tokens: { ...tokens },
    };
    setState((prev) => {
      const next: BrandState = {
        ...prev,
        brands: [brand, ...prev.brands],
      };
      saveToStorage(next);
      return next;
    });
    return brand;
  }, []);

  const updateBrand = useCallback((id: string, updates: Partial<Brand>) => {
    setState((prev) => {
      const brands = prev.brands.map((b) =>
        b.id === id ? { ...b, ...updates, tokens: updates.tokens ? { ...updates.tokens } : b.tokens } : b
      );
      const next = { ...prev, brands };
      saveToStorage(next);
      return next;
    });
  }, []);

  const deleteBrand = useCallback((id: string) => {
    setState((prev) => {
      const next: BrandState = {
        brands: prev.brands.filter((b) => b.id !== id),
        activeBrandId: prev.activeBrandId === id ? null : prev.activeBrandId,
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  const setActiveBrand = useCallback((id: string | null) => {
    setState((prev) => {
      const next = { ...prev, activeBrandId: id };
      saveToStorage(next);
      return next;
    });
  }, []);

  return {
    brands: state.brands,
    activeBrandId: state.activeBrandId,
    activeBrand,
    hasActiveBrand,
    addBrand,
    updateBrand,
    deleteBrand,
    setActiveBrand,
  };
}
