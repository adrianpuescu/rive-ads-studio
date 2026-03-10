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

  const panelBase = `absolute right-0 top-0 w-[300px] h-full z-[25] bg-white border-l border-[#e5e5e5] flex flex-col transition-transform duration-250 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-[300px]'}`;
  const headerClass = 'flex-shrink-0 flex items-center justify-between py-3 px-4 border-b border-[#e5e5e5] gap-2';
  const titleClass = 'font-sans font-semibold text-sm m-0 text-text-primary flex-1 text-center';
  const closeBtn = 'w-7 h-7 p-0 text-xl leading-none text-text-secondary bg-transparent border-0 rounded-sm cursor-pointer hover:text-text-primary hover:bg-[#f0f0f0] transition-colors duration-150';
  const contentClass = 'flex-1 min-h-0 overflow-y-auto p-4 scrollbar-thin';
  const labelClass = 'block font-sans text-xs font-medium text-text-primary mb-2 [&+&]:mt-3';
  const inputClass = 'block w-full mt-1 py-2 px-2.5 font-sans text-[13px] border border-border rounded text-text-primary bg-white';
  const colorRowClass = 'flex items-center gap-2 mt-1';
  const colorPickerClass = 'w-9 h-8 p-0.5 border border-border rounded cursor-pointer bg-white';
  const hexInputClass = 'flex-1 min-w-0 block w-full mt-1 py-2 px-2.5 font-sans text-[13px] border border-border rounded text-text-primary bg-white cursor-pointer';
  const sectionTitle = 'font-sans text-[10px] font-semibold tracking-wider uppercase text-text-secondary m-0 mb-2.5';
  const sectionClass = 'mb-5';

  if (view === 'form') {
    return (
      <div className={panelBase} role="dialog" aria-label={formMode.kind === 'new' ? 'New Brand' : `Edit ${formMode.brand.name}`}>
        <div className={headerClass}>
          <button type="button" className="py-1 px-2 font-sans text-[13px] text-text-secondary bg-transparent border-0 rounded cursor-pointer mr-auto hover:text-text-primary hover:bg-[#f0f0f0] transition-colors duration-150" onClick={goToList} aria-label="Back to list">
            ← Back
          </button>
          <h2 className={titleClass}>{formMode.kind === 'new' ? 'New Brand' : `Edit ${formMode.brand.name}`}</h2>
          <button type="button" className={closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={contentClass}>
          <label className={labelClass}>
            Brand Name <span className="text-error">*</span>
            <input type="text" className={inputClass} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Nike" />
          </label>
          <label className={labelClass}>
            Brand Voice
            <input type="text" className={inputClass} value={form.tokens.brandVoice} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, brandVoice: e.target.value } }))} placeholder="e.g. bold and energetic" />
          </label>
          <section className={sectionClass}>
            <h3 className={sectionTitle}>COLORS</h3>
            <label className={labelClass}>
              Primary Color
              <div className={colorRowClass}>
                <input type="color" className={colorPickerClass} value={form.tokens.primaryColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, primaryColor: e.target.value } }))} aria-label="Primary color" />
                <input type="text" className={hexInputClass} value={form.tokens.primaryColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, primaryColor: e.target.value } }))} />
              </div>
            </label>
            <label className={labelClass}>
              Secondary Color
              <div className={colorRowClass}>
                <input type="color" className={colorPickerClass} value={form.tokens.secondaryColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, secondaryColor: e.target.value } }))} aria-label="Secondary color" />
                <input type="text" className={hexInputClass} value={form.tokens.secondaryColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, secondaryColor: e.target.value } }))} />
              </div>
            </label>
            <label className={labelClass}>
              Background Color
              <div className={colorRowClass}>
                <input type="color" className={colorPickerClass} value={form.tokens.backgroundColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, backgroundColor: e.target.value } }))} aria-label="Background color" />
                <input type="text" className={hexInputClass} value={form.tokens.backgroundColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, backgroundColor: e.target.value } }))} />
              </div>
            </label>
          </section>
          <section className={sectionClass}>
            <h3 className={sectionTitle}>TYPOGRAPHY</h3>
            <label className={labelClass}>
              Font Family
              <select className={hexInputClass} value={form.tokens.fontFamily} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, fontFamily: e.target.value } }))}>
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </label>
          </section>
          <button type="button" className="w-full py-2.5 px-4 font-sans font-medium text-[13px] text-white bg-ink border-0 rounded cursor-pointer mt-2 hover:bg-[#2d2c2a] transition-colors duration-150" onClick={handleSave}>Save Brand</button>
          <button type="button" className="block w-full py-2 py-0 font-sans text-[13px] text-[#999] bg-transparent border-0 cursor-pointer mt-1 text-center no-underline hover:text-text-secondary" onClick={goToList}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute right-0 top-0 w-[300px] h-full z-[25] bg-white border-l border-[#e5e5e5] flex flex-col transition-transform duration-250 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-[300px]'}`} role="dialog" aria-label="Brands">
      <div className="flex-shrink-0 flex items-center justify-between py-3 px-4 border-b border-[#e5e5e5] gap-2 flex-wrap">
        <h2 className="font-sans font-semibold text-sm m-0 text-text-primary flex-1 text-center">Brands</h2>
        <div className="flex items-center gap-1">
          <button type="button" className="py-1 px-2.5 font-sans text-xs font-medium text-text-primary bg-transparent border border-border rounded cursor-pointer hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-colors duration-150" onClick={openNew} aria-label="Create new brand">+ New</button>
          <button type="button" className="w-7 h-7 p-0 text-xl leading-none text-text-secondary bg-transparent border-0 rounded-sm cursor-pointer hover:text-text-primary hover:bg-[#f0f0f0] transition-colors duration-150" onClick={onClose} aria-label="Close">×</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-thin">
        <label className="flex items-center gap-2.5 mb-4 cursor-pointer select-none">
          <input type="checkbox" className="peer absolute opacity-0 w-0 h-0" checked={isEnabled} onChange={onToggleEnabled} aria-label="Use brand tokens" />
          <span className="relative w-9 h-5 bg-[#ddd] rounded-[10px] transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-sm after:transition-transform duration-200 peer-checked:bg-ink peer-checked:after:translate-x-4" />
          <span className="font-sans text-[13px] text-text-primary">Use brand tokens</span>
        </label>
        <div className={`mb-3 ${!isEnabled ? 'opacity-60 pointer-events-none' : ''}`}>
          {brands.length === 0 ? (
            <div className="text-center py-6">
              <p className="font-sans text-[13px] text-text-secondary m-0 mb-3">No brands yet</p>
              <button type="button" className="py-2 px-4 font-sans text-[13px] font-medium text-white bg-ink border-0 rounded cursor-pointer hover:bg-[#2d2c2a] transition-colors duration-150" onClick={openNew}>Create your first brand</button>
            </div>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-1" role="list">
              {brands.map((brand) => {
                const isActive = activeBrandId === brand.id;
                const isConfirmingDelete = confirmDeleteId === brand.id;
                return (
                  <li
                    key={brand.id}
                    className={`flex items-center gap-2 py-2.5 px-3 rounded border-l-[3px] border-transparent bg-white hover:bg-[#fafafa] transition-colors duration-150 ${isActive ? 'border-l-ink bg-[#f9f9f9]' : ''}`}
                  >
                    <input type="radio" name="activeBrand" className="w-4 h-4 m-0 flex-shrink-0 cursor-pointer" checked={isActive} onChange={() => onSetActiveBrand(brand.id)} aria-label={`Select ${brand.name} as active`} />
                    <span className="flex-1 min-w-0 font-sans font-semibold text-[13px] text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">{brand.name}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="flex gap-0.5" aria-hidden>
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: brand.tokens.primaryColor }} />
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: brand.tokens.secondaryColor }} />
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: brand.tokens.backgroundColor }} />
                      </span>
                      <span className="text-[11px] text-text-secondary max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap">{truncateFont(brand.tokens.fontFamily, 14)}</span>
                    </div>
                    <button type="button" className="flex-shrink-0 w-7 h-7 p-0 text-sm flex items-center justify-center bg-transparent border-0 rounded cursor-pointer text-text-secondary hover:text-text-primary hover:bg-[#f0f0f0] transition-colors duration-150" onClick={() => openEdit(brand)} aria-label={`Edit ${brand.name}`}>✎</button>
                    {isConfirmingDelete ? (
                      <>
                        <span className="text-[11px] text-text-secondary mr-0.5">Delete?</span>
                        <button type="button" className="flex-shrink-0 w-7 h-7 p-0 text-[11px] text-error flex items-center justify-center bg-transparent border-0 rounded cursor-pointer hover:bg-[#fef2f2] transition-colors duration-150" onClick={() => handleDelete(brand.id)}>Yes</button>
                        <button type="button" className="flex-shrink-0 w-7 h-7 p-0 flex items-center justify-center bg-transparent border-0 rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors duration-150" onClick={() => setConfirmDeleteId(null)}>No</button>
                      </>
                    ) : (
                      <button type="button" className="flex-shrink-0 w-7 h-7 p-0 flex items-center justify-center bg-transparent border-0 rounded cursor-pointer text-text-secondary hover:text-error hover:bg-[#fef2f2] transition-colors duration-150" onClick={() => handleDelete(brand.id)} aria-label={`Delete ${brand.name}`}>🗑</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {activeBrand && isEnabled && (
          <div className="text-xs text-[#166534] pt-3 border-t border-[#e5e5e5] mt-auto" role="status">◈ {activeBrand.name} active</div>
        )}
      </div>
    </div>
  );
}
