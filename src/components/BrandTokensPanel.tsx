/**
 * Brand Tokens panel: drawer from the right to edit brand colors, font, and voice.
 * Overlays Inspector; same slide animation as LibraryPanel (translateX).
 */

import { useState, useCallback, useEffect } from 'react';
import type { BrandTokens } from '../types/brand-tokens';

const FONT_OPTIONS = [
  'Inter',
  'DM Sans',
  'Playfair Display',
  'Fraunces',
  'Syne',
  'Helvetica Neue',
  'Georgia',
  'Montserrat',
] as const;

export interface BrandTokensPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: BrandTokens | null;
  onSave: (tokens: BrandTokens) => void;
  onClear: () => void;
}

const DEFAULT_TOKENS: BrandTokens = {
  primaryColor: '#E84B2A',
  secondaryColor: '#1a1a1a',
  backgroundColor: '#ffffff',
  fontFamily: 'DM Sans',
  brandName: '',
  brandVoice: '',
};

export function BrandTokensPanel({
  isOpen,
  onClose,
  tokens,
  onSave,
  onClear,
}: BrandTokensPanelProps) {
  const [form, setForm] = useState<BrandTokens>(tokens ?? DEFAULT_TOKENS);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setForm(tokens ?? DEFAULT_TOKENS);
  }, [tokens, isOpen]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  const handleSave = useCallback(() => {
    onSave(form);
    setSavedBanner(true);
  }, [form, onSave]);

  useEffect(() => {
    if (!savedBanner) return;
    const t = setTimeout(() => setSavedBanner(false), 3000);
    return () => clearTimeout(t);
  }, [savedBanner]);

  const handleClear = useCallback(() => {
    onClear();
    setForm(DEFAULT_TOKENS);
  }, [onClear]);

  const update = useCallback(<K extends keyof BrandTokens>(key: K, value: BrandTokens[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div
      className={`brand-tokens-panel ${isOpen ? 'brand-tokens-panel-open' : ''}`}
      role="dialog"
      aria-label="Brand Tokens"
    >
      <div className="brand-tokens-panel-header">
        <h2 className="brand-tokens-panel-title">Brand Tokens</h2>
        <button
          type="button"
          className="brand-tokens-panel-close"
          onClick={onClose}
          aria-label="Close Brand Tokens"
        >
          ×
        </button>
      </div>
      <div className="brand-tokens-panel-content">
        {savedBanner && (
          <div className="brand-tokens-panel-banner" role="status">
            ✓ Brand tokens active — AI will use these in every generation
          </div>
        )}

        <section className="brand-tokens-section">
          <h3 className="brand-tokens-section-title">IDENTITY</h3>
          <label className="brand-tokens-label">
            Brand Name
            <input
              type="text"
              className="brand-tokens-input"
              value={form.brandName}
              onChange={(e) => update('brandName', e.target.value)}
              placeholder="e.g. Nike"
            />
          </label>
          <label className="brand-tokens-label">
            Brand Voice
            <input
              type="text"
              className="brand-tokens-input"
              value={form.brandVoice}
              onChange={(e) => update('brandVoice', e.target.value)}
              placeholder="e.g. bold and energetic"
            />
          </label>
        </section>

        <section className="brand-tokens-section">
          <h3 className="brand-tokens-section-title">COLORS</h3>
          <label className="brand-tokens-label">
            Primary Color
            <div className="brand-tokens-color-row">
              <input
                type="color"
                className="brand-tokens-color-picker"
                value={form.primaryColor}
                onChange={(e) => update('primaryColor', e.target.value)}
                aria-label="Primary color"
              />
              <input
                type="text"
                className="brand-tokens-hex"
                value={form.primaryColor}
                onChange={(e) => update('primaryColor', e.target.value)}
                placeholder="#000000"
              />
            </div>
          </label>
          <label className="brand-tokens-label">
            Secondary Color
            <div className="brand-tokens-color-row">
              <input
                type="color"
                className="brand-tokens-color-picker"
                value={form.secondaryColor}
                onChange={(e) => update('secondaryColor', e.target.value)}
                aria-label="Secondary color"
              />
              <input
                type="text"
                className="brand-tokens-hex"
                value={form.secondaryColor}
                onChange={(e) => update('secondaryColor', e.target.value)}
                placeholder="#000000"
              />
            </div>
          </label>
          <label className="brand-tokens-label">
            Background Color
            <div className="brand-tokens-color-row">
              <input
                type="color"
                className="brand-tokens-color-picker"
                value={form.backgroundColor}
                onChange={(e) => update('backgroundColor', e.target.value)}
                aria-label="Background color"
              />
              <input
                type="text"
                className="brand-tokens-hex"
                value={form.backgroundColor}
                onChange={(e) => update('backgroundColor', e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          </label>
        </section>

        <section className="brand-tokens-section">
          <h3 className="brand-tokens-section-title">TYPOGRAPHY</h3>
          <label className="brand-tokens-label">
            Font Family
            <select
              className="brand-tokens-select"
              value={form.fontFamily}
              onChange={(e) => update('fontFamily', e.target.value)}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
        </section>

        <button
          type="button"
          className="brand-tokens-save-btn"
          onClick={handleSave}
        >
          Save Tokens
        </button>
        <button
          type="button"
          className="brand-tokens-clear-btn"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
