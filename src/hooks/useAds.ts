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
  updated_at?: string | null;
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
    updated_at: row.updated_at,
    adSpec: spec,
    headline: row.name || row.ad_spec?.text?.headline?.value || '',
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
    .from('ads')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || data == null) return [];

  return data.map(mapRowToAd);
}

/** Fetch a single ad by id for the user (e.g. Dashboard opening in editor with state). */
export async function fetchAdById(userId: string, id: string): Promise<Ad | null> {
  const { data, error } = await supabase
    .from('ads')
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
  const [loading, setLoading] = useState(true);

  const refreshAds = useCallback(async () => {
    if (!user) return;
    const loaded = await loadAds(user.id);
    setAds(loaded);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAds([]);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    void (async () => {
      const loaded = await loadAds(user.id);
      if (!isCancelled) {
        setAds(loaded);
        setLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, user]);

  const saveAd = useCallback(
    async (ad: Omit<Ad, 'id' | 'createdAt'>): Promise<string> => {
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
        const { error } = await supabase.from('ads').upsert(payload).select();
        if (error) {
          console.error('[saveAd] upsert error:', error);
          throw error;
        }
        await refreshAds();
      }

      return full.id;
    },
    [user, refreshAds]
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
          .from('ads')
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
    async (id: string, data: Omit<Ad, 'id' | 'createdAt'>): Promise<void> => {
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

        const { error } = await supabase
          .from('ads')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('[updateItem] error:', error);
          throw error;
        }
        await refreshAds();
      }
    },
    [user, refreshAds]
  );

  const removeItem = useCallback(
    async (id: string): Promise<void> => {
      setAds((prev) => prev.filter((x) => x.id !== id));

      if (user) {
        const { error } = await supabase
          .from('ads')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('[removeItem] error:', error);
        }
      }
    },
    [user]
  );

  const renameItem = useCallback(
    async (id: string, newName: string): Promise<void> => {
      setAds((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, headline: newName } : item
        )
      );

      if (user) {
        const { error } = await supabase
          .from('ads')
          .update({
            name: newName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('[renameItem] error:', error);
          throw error;
        }

        await refreshAds();
      }
    },
    [user, refreshAds]
  );

  const duplicateItem = useCallback(
    async (id: string): Promise<string | null> => {
      if (!user) return null;

      const original = ads.find((a) => a.id === id);
      if (!original) return null;

      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const newName = `Copy of ${original.headline || 'Untitled'}`;

      const duplicated: Ad = {
        ...original,
        id: newId,
        headline: newName,
        createdAt: Date.now(),
        updated_at: now,
      };

      setAds((prev) => [duplicated, ...prev]);

      const payload: AdRow = {
        id: newId,
        user_id: user.id,
        name: newName,
        ad_spec: original.adSpec ?? null,
        chat_history: original.chatHistory ?? [],
        thumbnail: original.thumbnail ?? null,
        created_at: now,
        updated_at: now,
      };

      const { error } = await supabase.from('ads').insert(payload);
      if (error) {
        console.error('[duplicateItem] error:', error);
        setAds((prev) => prev.filter((a) => a.id !== newId));
        throw error;
      }

      return newId;
    },
    [user, ads]
  );

  const clearAll = useCallback(() => {
    setAds([]);

    if (user) {
      void supabase.from('ads').delete().eq('user_id', user.id);
    }
  }, [user]);

  return {
    items: ads,
    loading,
    saveAd,
    updateItemThumbnail,
    updateItem,
    removeItem,
    renameItem,
    duplicateItem,
    clearAll,
  };
}
