/**
 * Centralized localStorage keys for RiveAds Studio.
 * Use these constants instead of hardcoded strings to avoid key drift and enable migration.
 *
 * Chat history: stored per-ad inside the ADS array (each ad has a `chatHistory` property).
 * Legacy data may have `conversationHistory` on ad objects; useAds normalizes on load.
 */
export const STORAGE_KEYS = {
  /** List of saved ads. Each ad has chatHistory (legacy: conversationHistory). */
  ADS: 'riveads_library',
  BRAND_STATE: 'riveads_brand_state',
  CHAT_COLLAPSED: 'riveads_chat_collapsed',
  INSPECTOR_COLLAPSED: 'riveads_inspector_collapsed',
  PENDING_LOAD: 'riveads_pending_load',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
