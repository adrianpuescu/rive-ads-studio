/**
 * Brand Manager: multiple brands with tokens; one active brand used in AI prompts.
 * Persisted in Supabase as per-user brands; active brand lives in hook state.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { BrandTokens } from '../types/brand-tokens';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

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

interface BrandRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  font_family: string | null;
  brand_voice: string | null;
}

async function loadBrands(userId: string): Promise<Brand[]> {
  const { data, error } = await supabase
    .from<BrandRow>('brands')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || data == null) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at != null ? new Date(row.created_at).getTime() : Date.now(),
    tokens: {
      primaryColor: row.primary_color ?? '',
      secondaryColor: row.secondary_color ?? '',
      backgroundColor: row.background_color ?? '',
      fontFamily: row.font_family ?? '',
      brandVoice: row.brand_voice || '',
    },
  }));
}

export function useBrandTokens() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<BrandState>({ brands: [], activeBrandId: null });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState({ brands: [], activeBrandId: null });
      return;
    }

    let isCancelled = false;

    void (async () => {
      const brands = await loadBrands(user.id);
      if (!isCancelled) {
        setState((prev) => {
          const activeBrandId =
            prev.activeBrandId && brands.some((b) => b.id === prev.activeBrandId)
              ? prev.activeBrandId
              : brands.length > 0
              ? brands[0]!.id
              : null;
          return { brands, activeBrandId };
        });
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, user]);

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
      return next;
    });

    if (user) {
      const payload: BrandRow = {
        id: brand.id,
        user_id: user.id,
        name: brand.name,
        primary_color: brand.tokens.primaryColor,
        secondary_color: brand.tokens.secondaryColor,
        background_color: brand.tokens.backgroundColor,
        font_family: brand.tokens.fontFamily,
        brand_voice: brand.tokens.brandVoice || '',
        created_at: new Date(brand.createdAt).toISOString(),
      };

      void supabase.from<BrandRow>('brands')
        .upsert(payload)
        .then(({ error }) => {
          if (error) console.error('[addBrand] upsert error:', error);
          else console.log('[addBrand] saved successfully');
        });
    }

    return brand;
  }, [user]);

  const updateBrand = useCallback(
    (id: string, updates: Partial<Brand>) => {
      setState((prev) => {
        const brands = prev.brands.map((b) =>
          b.id === id ? { ...b, ...updates, tokens: updates.tokens ? { ...updates.tokens } : b.tokens } : b
        );
        const next = { ...prev, brands };
        return next;
      });

      if (user) {
        const payload: Partial<BrandRow> = {
          name: updates.name,
          ...(updates.tokens && {
            primary_color: updates.tokens.primaryColor,
            secondary_color: updates.tokens.secondaryColor,
            background_color: updates.tokens.backgroundColor,
            font_family: updates.tokens.fontFamily,
            brand_voice: updates.tokens.brandVoice || '',
          }),
        };

        void supabase
          .from<BrandRow>('brands')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id);
      }
    },
    [user]
  );

  const deleteBrand = useCallback(
    (id: string) => {
      setState((prev) => {
        const next: BrandState = {
          brands: prev.brands.filter((b) => b.id !== id),
          activeBrandId: prev.activeBrandId === id ? null : prev.activeBrandId,
        };
        return next;
      });

      if (user) {
        void supabase
          .from<BrandRow>('brands')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
      }
    },
    [user]
  );

  const setActiveBrand = useCallback((id: string | null) => {
    setState((prev) => {
      const next = { ...prev, activeBrandId: id };
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
