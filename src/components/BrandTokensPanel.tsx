/**
 * Brand Manager panel: drawer from the right.
 * State 1: list of brands + global enable toggle.
 * State 2: form to create or edit a brand.
 */

import { useState, useCallback, useEffect } from 'react';
import type { Brand } from '../hooks/useBrandTokens';
import type { BrandTokens as BrandTokensType } from '../types/brand-tokens';

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

const DEFAULT_TOKENS: BrandTokensType = {
  primaryColor: '#E84B2A',
  secondaryColor: '#1a1a1a',
  backgroundColor: '#ffffff',
  fontFamily: 'DM Sans',
  brandVoice: '',
};

function truncateFont(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen).trim() + '…';
}

export interface BrandTokensPanelProps {
  isOpen: boolean;
  onClose: () => void;
  brands: Brand[];
  activeBrandId: string | null;
  isEnabled: boolean;
  onToggleEnabled: () => void;
  onAddBrand: (name: string, tokens: BrandTokensType) => Brand;
  onUpdateBrand: (id: string, updates: Partial<Brand>) => void;
  onDeleteBrand: (id: string) => void;
  onSetActiveBrand: (id: string | null) => void;
}

type View = 'list' | 'form';
type FormMode = { kind: 'new' } | { kind: 'edit'; brand: Brand };

export function BrandTokensPanel({
  isOpen,
  onClose,
  brands,
  activeBrandId,
  isEnabled,
  onToggleEnabled,
  onAddBrand,
  onUpdateBrand,
  onDeleteBrand,
  onSetActiveBrand,
}: BrandTokensPanelProps) {
  const [view, setView] = useState<View>('list');
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'new' });
  const [form, setForm] = useState({ name: '', tokens: DEFAULT_TOKENS });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const goToList = useCallback(() => {
    setView('list');
    setConfirmDeleteId(null);
  }, []);

  const openNew = useCallback(() => {
    setFormMode({ kind: 'new' });
    setForm({ name: '', tokens: { ...DEFAULT_TOKENS } });
    setView('form');
  }, []);

  const openEdit = useCallback((brand: Brand) => {
    setFormMode({ kind: 'edit', brand });
    setForm({ name: brand.name, tokens: { ...brand.tokens } });
    setView('form');
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'form') goToList();
        else onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, view, goToList, onClose]);

  const handleSave = useCallback(() => {
    const name = form.name.trim() || 'Unnamed';
    const tokens = form.tokens;
    if (formMode.kind === 'new') {
      const added = onAddBrand(name, tokens);
      onSetActiveBrand(added.id);
      if (!isEnabled) onToggleEnabled();
      goToList();
    } else {
      onUpdateBrand(formMode.brand.id, { name, tokens });
      goToList();
    }
  }, [form, formMode, isEnabled, onAddBrand, onUpdateBrand, onSetActiveBrand, onToggleEnabled, goToList]);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirmDeleteId === id) {
        onDeleteBrand(id);
        setConfirmDeleteId(null);
      } else {
        setConfirmDeleteId(id);
      }
    },
    [confirmDeleteId, onDeleteBrand]
  );

  const activeBrand = activeBrandId ? brands.find((b) => b.id === activeBrandId) ?? null : null;

  if (view === 'form') {
    return (
      <div
        className={`brand-tokens-panel ${isOpen ? 'brand-tokens-panel-open' : ''}`}
        role="dialog"
        aria-label={formMode.kind === 'new' ? 'New Brand' : `Edit ${formMode.brand.name}`}
      >
        <div className="brand-tokens-panel-header">
          <button
            type="button"
            className="brand-tokens-panel-back"
            onClick={goToList}
            aria-label="Back to list"
          >
            ← Back
          </button>
          <h2 className="brand-tokens-panel-title">
            {formMode.kind === 'new' ? 'New Brand' : `Edit ${formMode.brand.name}`}
          </h2>
          <button
            type="button"
            className="brand-tokens-panel-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="brand-tokens-panel-content">
          <label className="brand-tokens-label">
            Brand Name <span className="brand-tokens-required">*</span>
            <input
              type="text"
              className="brand-tokens-input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Nike"
            />
          </label>
          <label className="brand-tokens-label">
            Brand Voice
            <input
              type="text"
              className="brand-tokens-input"
              value={form.tokens.brandVoice}
              onChange={(e) =>
                setForm((p) => ({ ...p, tokens: { ...p.tokens, brandVoice: e.target.value } }))
              }
              placeholder="e.g. bold and energetic"
            />
          </label>

          <section className="brand-tokens-section">
            <h3 className="brand-tokens-section-title">COLORS</h3>
            <label className="brand-tokens-label">
              Primary Color
              <div className="brand-tokens-color-row">
                <input
                  type="color"
                  className="brand-tokens-color-picker"
                  value={form.tokens.primaryColor}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tokens: { ...p.tokens, primaryColor: e.target.value } }))
                  }
                  aria-label="Primary color"
                />
                <input
                  type="text"
                  className="brand-tokens-hex"
                  value={form.tokens.primaryColor}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tokens: { ...p.tokens, primaryColor: e.target.value } }))
                  }
                />
              </div>
            </label>
            <label className="brand-tokens-label">
              Secondary Color
              <div className="brand-tokens-color-row">
                <input
                  type="color"
                  className="brand-tokens-color-picker"
                  value={form.tokens.secondaryColor}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tokens: { ...p.tokens, secondaryColor: e.target.value },
                    }))
                  }
                  aria-label="Secondary color"
                />
                <input
                  type="text"
                  className="brand-tokens-hex"
                  value={form.tokens.secondaryColor}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tokens: { ...p.tokens, secondaryColor: e.target.value },
                    }))
                  }
                />
              </div>
            </label>
            <label className="brand-tokens-label">
              Background Color
              <div className="brand-tokens-color-row">
                <input
                  type="color"
                  className="brand-tokens-color-picker"
                  value={form.tokens.backgroundColor}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tokens: { ...p.tokens, backgroundColor: e.target.value },
                    }))
                  }
                  aria-label="Background color"
                />
                <input
                  type="text"
                  className="brand-tokens-hex"
                  value={form.tokens.backgroundColor}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tokens: { ...p.tokens, backgroundColor: e.target.value },
                    }))
                  }
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
                value={form.tokens.fontFamily}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tokens: { ...p.tokens, fontFamily: e.target.value } }))
                }
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <button type="button" className="brand-tokens-save-btn" onClick={handleSave}>
            Save Brand
          </button>
          <button type="button" className="brand-tokens-clear-btn" onClick={goToList}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`brand-tokens-panel ${isOpen ? 'brand-tokens-panel-open' : ''}`}
      role="dialog"
      aria-label="Brands"
    >
      <div className="brand-tokens-panel-header brand-tokens-panel-header-list">
        <h2 className="brand-tokens-panel-title">Brands</h2>
        <div className="brand-tokens-panel-header-actions">
          <button
            type="button"
            className="brand-tokens-panel-new-btn"
            onClick={openNew}
            aria-label="Create new brand"
          >
            + New
          </button>
          <button
            type="button"
            className="brand-tokens-panel-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
      <div className="brand-tokens-panel-content">
        <label className="brand-tokens-toggle-wrap">
          <input
            type="checkbox"
            className="brand-tokens-toggle-input"
            checked={isEnabled}
            onChange={onToggleEnabled}
            aria-label="Use brand tokens"
          />
          <span className="brand-tokens-toggle-slider" />
          <span className="brand-tokens-toggle-label">Use brand tokens</span>
        </label>

        <div className={`brand-tokens-list-wrap ${!isEnabled ? 'brand-tokens-list-disabled' : ''}`}>
          {brands.length === 0 ? (
            <div className="brand-tokens-empty">
              <p className="brand-tokens-empty-text">No brands yet</p>
              <button
                type="button"
                className="brand-tokens-empty-btn"
                onClick={openNew}
              >
                Create your first brand
              </button>
            </div>
          ) : (
            <ul className="brand-tokens-list" role="list">
              {brands.map((brand) => {
                const isActive = activeBrandId === brand.id;
                const isConfirmingDelete = confirmDeleteId === brand.id;
                return (
                  <li
                    key={brand.id}
                    className={`brand-tokens-list-item ${isActive ? 'brand-tokens-list-item-active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="activeBrand"
                      className="brand-tokens-radio"
                      checked={isActive}
                      onChange={() => onSetActiveBrand(brand.id)}
                      aria-label={`Select ${brand.name} as active`}
                    />
                    <span className="brand-tokens-item-name">{brand.name}</span>
                    <div className="brand-tokens-item-preview">
                      <span className="brand-tokens-item-dots" aria-hidden>
                        <span
                          className="brand-tokens-dot"
                          style={{ background: brand.tokens.primaryColor }}
                        />
                        <span
                          className="brand-tokens-dot"
                          style={{ background: brand.tokens.secondaryColor }}
                        />
                        <span
                          className="brand-tokens-dot"
                          style={{ background: brand.tokens.backgroundColor }}
                        />
                      </span>
                      <span className="brand-tokens-item-font">
                        {truncateFont(brand.tokens.fontFamily, 14)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="brand-tokens-item-btn brand-tokens-item-edit"
                      onClick={() => openEdit(brand)}
                      aria-label={`Edit ${brand.name}`}
                    >
                      ✎
                    </button>
                    {isConfirmingDelete ? (
                      <>
                        <span className="brand-tokens-confirm-label">Delete?</span>
                        <button
                          type="button"
                          className="brand-tokens-item-btn brand-tokens-item-confirm"
                          onClick={() => handleDelete(brand.id)}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className="brand-tokens-item-btn brand-tokens-item-cancel"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="brand-tokens-item-btn brand-tokens-item-delete"
                        onClick={() => handleDelete(brand.id)}
                        aria-label={`Delete ${brand.name}`}
                      >
                        🗑
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {activeBrand && isEnabled && (
          <div className="brand-tokens-footer-active" role="status">
            ◈ {activeBrand.name} active
          </div>
        )}
      </div>
    </div>
  );
}
