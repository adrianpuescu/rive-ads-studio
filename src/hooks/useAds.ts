/**
 * Ads: session history of generated ads, persisted in Supabase.
 * Used by editor and by /projects page.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { AdSpec } from '../types/ad-spec.schema';

export interface Ad {
  id: string;
  createdAt: number;
  adSpec?: AdSpec;
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

interface AdRow {
  id: string;
  user_id: string;
  name: string | null;
  ad_spec: AdSpec | null;
  chat_history: Ad['chatHistory'] | null;
  thumbnail: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function mapRowToAd(row: AdRow): Ad {
  const spec = row.ad_spec ?? undefined;
  const createdAt =
    row.created_at != null ? new Date(row.created_at).getTime() : Date.now();

  return {
    id: row.id,
    createdAt,
    adSpec: spec,
    headline: row.ad_spec?.text?.headline?.value || '',
    subheadline: row.ad_spec?.text?.subheadline?.value || '',
    cta: row.ad_spec?.text?.cta?.value || '',
    colors: {
      background: row.ad_spec?.colors?.background || '#ffffff',
      primary: row.ad_spec?.colors?.primary || '#000000',
      secondary: row.ad_spec?.colors?.secondary || '#666666',
      headlineColor: row.ad_spec?.colors?.headlineColor,
      subheadlineColor: row.ad_spec?.colors?.subheadlineColor,
      ctaColor: row.ad_spec?.colors?.ctaColor,
    },
    prompt: spec?.generation?.prompt ?? '',
    thumbnail: row.thumbnail ?? undefined,
    chatHistory: row.chat_history ?? [],
  };
}

async function loadAds(userId: string): Promise<Ad[]> {
  const { data, error } = await supabase
    .from<AdRow>('ads')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || data == null) return [];

  return data.map(mapRowToAd);
}

/** Fetch a single ad by id for the user (e.g. Dashboard opening in editor with state). */
export async function fetchAdById(userId: string, id: string): Promise<Ad | null> {
  const { data, error } = await supabase
    .from<AdRow>('ads')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (error || data == null) return null;
  return mapRowToAd(data);
}

export function useAds() {
  const { user, loading: authLoading } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAds([]);
      return;
    }

    let isCancelled = false;

    void (async () => {
      const loaded = await loadAds(user.id);
      if (!isCancelled) {
        setAds(loaded);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, user]);

  const saveAd = useCallback(
    (ad: Omit<Ad, 'id' | 'createdAt'>): string => {
      const full: Ad = {
        ...ad,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };

      setAds((prev) => [full, ...prev]);

      if (user) {
        const payload: AdRow = {
          id: full.id,
          user_id: user.id,
          name: full.adSpec?.text?.headline?.value || full.headline || 'Untitled',
          ad_spec: full.adSpec ?? null,
          chat_history: full.chatHistory ?? [],
          thumbnail: full.thumbnail ?? null,
          created_at: new Date(full.createdAt || Date.now()).toISOString(),
          updated_at: new Date().toISOString(),
        };
        void supabase.from<AdRow>('ads').upsert(payload).select().then(({ error }) => {
          if (error) console.error('[saveAd] upsert error:', error);
        });
      }

      return full.id;
    },
    [user]
  );

  const updateItemThumbnail = useCallback(
    (id: string, thumbnail: string) => {
      setAds((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                thumbnail,
              }
            : item
        )
      );

      if (user) {
        const payload: Partial<AdRow> = {
          thumbnail,
          updated_at: new Date().toISOString(),
        };

        void supabase
          .from<AdRow>('ads')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error('[updateThumbnail] error:', error);
          });
      }
    },
    [user]
  );

  const updateItem = useCallback(
    (id: string, data: Omit<Ad, 'id' | 'createdAt'>) => {
      setAds((prev) => {
        const next = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                adSpec: data.adSpec ?? item.adSpec,
                headline: data.headline,
                subheadline: data.subheadline,
                cta: data.cta,
                colors: data.colors,
                prompt: data.prompt,
                chatHistory: data.chatHistory ?? item.chatHistory,
              }
            : item
        );
        return next;
      });

      if (user) {
        const nextSpec = data.adSpec ?? undefined;
        const payload: Partial<AdRow> = {
          name: nextSpec?.text?.headline?.value,
          ad_spec: nextSpec ?? null,
          chat_history: data.chatHistory ?? null,
          thumbnail: data.thumbnail,
          updated_at: new Date().toISOString(),
        };

        void supabase
          .from<AdRow>('ads')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id);
      }
    },
    [user]
  );

  const removeItem = useCallback(
    (id: string) => {
      setAds((prev) => prev.filter((x) => x.id !== id));

      if (user) {
        void supabase
          .from<AdRow>('ads')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
      }
    },
    [user]
  );

  const clearAll = useCallback(() => {
    setAds([]);

    if (user) {
      void supabase.from<AdRow>('ads').delete().eq('user_id', user.id);
    }
  }, [user]);

  return { items: ads, saveAd, updateItemThumbnail, updateItem, removeItem, clearAll };
}
