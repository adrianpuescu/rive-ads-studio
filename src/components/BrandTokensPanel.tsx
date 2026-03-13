/**
 * Brand Manager panel: drawer from the left (over ChatPanel).
 * State 1: list of brands; select/deselect one as active (or None).
 * State 2: form to create or edit a brand.
 */

import { useState, useCallback, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';
import { DrawerHeader } from './DrawerHeader';
import { SelectDropdown } from './SelectDropdown';
import { BrandItemSkeleton } from './skeletons';
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

export interface BrandTokensPanelProps {
  isOpen: boolean;
  onClose: () => void;
  brands: Brand[];
  isLoading?: boolean;
  activeBrandId: string | null;
  onAddBrand: (name: string, tokens: BrandTokensType) => Brand;
  onUpdateBrand: (id: string, updates: Partial<Brand>) => void;
  onDeleteBrand: (id: string) => void;
  onSetActiveBrand: (id: string | null) => void;
}

export function BrandTokensPanel({
  isOpen,
  onClose,
  brands,
  isLoading = false,
  activeBrandId,
  onAddBrand,
  onUpdateBrand,
  onDeleteBrand,
  onSetActiveBrand,
}: BrandTokensPanelProps) {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: '', tokens: DEFAULT_TOKENS });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const goToList = useCallback(() => {
    setView('list');
    setConfirmDeleteId(null);
  }, []);

  const openNew = useCallback(() => {
    setEditingBrand(null);
    setForm({ name: '', tokens: { ...DEFAULT_TOKENS } });
    setView('edit');
  }, []);

  const openEdit = useCallback((brand: Brand) => {
    setEditingBrand(brand);
    setForm({ name: brand.name, tokens: { ...brand.tokens } });
    setView('edit');
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'edit') goToList();
        else onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, view, goToList, onClose]);

  const handleSave = useCallback(() => {
    const name = form.name.trim() || 'Unnamed';
    const tokens = form.tokens;
    if (editingBrand === null) {
      const added = onAddBrand(name, tokens);
      onSetActiveBrand(added.id);
    } else {
      onUpdateBrand(editingBrand.id, { name, tokens });
    }
    goToList();
  }, [form, editingBrand, onAddBrand, onUpdateBrand, onSetActiveBrand, goToList]);

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

  return (
    <div
      className={`absolute left-0 top-0 w-[300px] h-full z-[25] bg-white border-r border-gray-200 flex flex-col transition-transform duration-250 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-[300px]'}`}
      role="dialog"
      aria-label="Brands"
    >
      {view === 'edit' ? (
        <>
          <DrawerHeader
            title={editingBrand ? 'Edit brand' : 'New brand'}
            onClose={onClose}
            back={{ label: '← Back', onClick: goToList }}
          />
          <div className="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-thin">
            <label className="block text-xs font-medium text-gray-900 mb-2">
              Brand Name <span className="text-red-500">*</span>
              <input
                type="text"
                className="block w-full mt-1 py-2 px-2.5 text-sm border border-gray-200 rounded text-gray-900 bg-white transition-colors duration-150 focus:outline-none focus:border-gray-400"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Nike"
              />
            </label>
            <label className="block text-xs font-medium text-gray-900 mb-2 mt-4">
              Brand Voice
              <input
                type="text"
                className="block w-full mt-1 py-2 px-2.5 text-sm border border-gray-200 rounded text-gray-900 bg-white transition-colors duration-150 focus:outline-none focus:border-gray-400"
                value={form.tokens.brandVoice}
                onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, brandVoice: e.target.value } }))}
                placeholder="e.g. bold and energetic"
              />
            </label>
            <section className="mb-5 mt-4">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-500 m-0 mb-2.5">Colors</h3>
              <label className="block text-xs font-medium text-gray-900 mb-2">
                Primary Color
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" className="w-9 h-8 p-0.5 border border-gray-200 rounded cursor-pointer bg-white transition-colors duration-150 focus:outline-none focus:border-gray-400" value={form.tokens.primaryColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, primaryColor: e.target.value } }))} aria-label="Primary color" />
                  <input type="text" className="flex-1 min-w-0 py-2 px-2.5 text-sm border border-gray-200 rounded text-gray-900 bg-white transition-colors duration-150 focus:outline-none focus:border-gray-400" value={form.tokens.primaryColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, primaryColor: e.target.value } }))} />
                </div>
              </label>
              <label className="block text-xs font-medium text-gray-900 mb-2">
                Secondary Color
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" className="w-9 h-8 p-0.5 border border-gray-200 rounded cursor-pointer bg-white transition-colors duration-150 focus:outline-none focus:border-gray-400" value={form.tokens.secondaryColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, secondaryColor: e.target.value } }))} aria-label="Secondary color" />
                  <input type="text" className="flex-1 min-w-0 py-2 px-2.5 text-sm border border-gray-200 rounded text-gray-900 bg-white transition-colors duration-150 focus:outline-none focus:border-gray-400" value={form.tokens.secondaryColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, secondaryColor: e.target.value } }))} />
                </div>
              </label>
              <label className="block text-xs font-medium text-gray-900 mb-2">
                Background Color
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" className="w-9 h-8 p-0.5 border border-gray-200 rounded cursor-pointer bg-white transition-colors duration-150 focus:outline-none focus:border-gray-400" value={form.tokens.backgroundColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, backgroundColor: e.target.value } }))} aria-label="Background color" />
                  <input type="text" className="flex-1 min-w-0 py-2 px-2.5 text-sm border border-gray-200 rounded text-gray-900 bg-white transition-colors duration-150 focus:outline-none focus:border-gray-400" value={form.tokens.backgroundColor} onChange={(e) => setForm((p) => ({ ...p, tokens: { ...p.tokens, backgroundColor: e.target.value } }))} />
                </div>
              </label>
            </section>
            <section className="mb-5 mt-4">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-500 m-0 mb-2.5">Typography</h3>
              <label className="block text-xs font-medium text-gray-900 mb-2">
                Font Family
                <SelectDropdown
                  className="mt-1"
                  value={form.tokens.fontFamily}
                  options={FONT_OPTIONS.map((font) => ({ value: font, label: font }))}
                  onChange={(fontFamily) => setForm((p) => ({ ...p, tokens: { ...p.tokens, fontFamily } }))}
                  ariaLabel="Font family"
                />
              </label>
            </section>
            <button type="button" className="w-full py-2.5 px-4 text-sm font-medium text-white bg-gray-900 border-0 rounded cursor-pointer mt-2 hover:bg-gray-800 transition-colors" onClick={handleSave}>Save Brand</button>
            <button type="button" className="block w-full text-sm text-gray-500 bg-transparent border-0 cursor-pointer mt-5 text-center hover:text-gray-900 transition-colors" onClick={goToList}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <DrawerHeader title="Brands" onClose={onClose} action={{ label: '+ New brand', onClick: openNew }} />
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col scrollbar-thin">
            <div className="flex-1 min-h-0 flex flex-col">
              {isLoading ? (
                <ul className="list-none m-0 p-3 flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i}>
                      <BrandItemSkeleton variant="detailed" />
                    </li>
                  ))}
                </ul>
              ) : brands.length === 0 ? (
                /* STARE GOALĂ */
                <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
                  <span className="text-4xl text-gray-200" aria-hidden>◈</span>
                  <p className="text-sm font-semibold text-gray-900 m-0">No brands yet</p>
                  <p className="text-xs text-gray-400 m-0">Create your first brand</p>
                  <button type="button" className="mt-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 cursor-pointer border-0 transition-colors" onClick={openNew}>New brand</button>
                </div>
              ) : (
                <ul className="list-none m-0 p-3 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto" role="list">
                  {/* None = deselect */}
                  <li
                    role="button"
                    tabIndex={0}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${activeBrandId === null ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:border-gray-400'}`}
                    onClick={() => onSetActiveBrand(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSetActiveBrand(null);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`flex-shrink-0 w-3 h-3 rounded-full border-2 ${activeBrandId === null ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} aria-hidden />
                      <span className="text-sm font-medium text-gray-700">None</span>
                    </div>
                  </li>
                  {brands.map((brand) => {
                    const isActive = activeBrandId === brand.id;
                    const isConfirmingDelete = confirmDeleteId === brand.id;
                    return (
                      <li
                        key={brand.id}
                        role="button"
                        tabIndex={0}
                        className={`relative border rounded-lg p-3 cursor-pointer transition-colors ${isConfirmingDelete ? 'border-red-200 bg-red-50' : isActive ? 'border-blue-200 bg-blue-50 hover:border-gray-400' : 'border-gray-200 hover:border-gray-400'}`}
                        onClick={() => onSetActiveBrand(isActive ? null : brand.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSetActiveBrand(isActive ? null : brand.id);
                          }
                        }}
                      >
                        {/* ROW 1 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                              type="button"
                              className={`flex-shrink-0 w-3 h-3 rounded-full ${isActive ? 'bg-blue-500' : 'border-2 border-gray-300'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetActiveBrand(isActive ? null : brand.id);
                              }}
                              aria-label={isActive ? `Deselect ${brand.name}` : `Select ${brand.name} as active`}
                              aria-checked={isActive}
                              role="radio"
                            />
                            <span className="text-sm font-semibold text-gray-900 truncate">{brand.name}</span>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 justify-end items-center" onClick={(e) => e.stopPropagation()}>
                            <button type="button" className="text-gray-400 hover:text-gray-900 px-2 py-1 bg-transparent border-0 cursor-pointer transition-colors flex items-center" onClick={() => openEdit(brand)} aria-label={`Edit ${brand.name}`}><Pencil className="w-3.5 h-3.5" /></button>
                            <button type="button" className="text-gray-400 hover:text-red-500 px-2 py-1 bg-transparent border-0 cursor-pointer transition-colors flex items-center" onClick={() => handleDelete(brand.id)} aria-label={`Delete ${brand.name}`}><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {/* ROW 2 */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-12">Colors</span>
                            <div className="flex gap-1">
                              <span className="w-4 h-4 rounded-full ring-1 ring-black/10 flex-shrink-0" style={{ background: brand.tokens.primaryColor }} aria-hidden />
                              <span className="w-4 h-4 rounded-full ring-1 ring-black/10 flex-shrink-0" style={{ background: brand.tokens.secondaryColor }} aria-hidden />
                              <span className="w-4 h-4 rounded-full ring-1 ring-black/10 flex-shrink-0" style={{ background: brand.tokens.backgroundColor }} aria-hidden />
                            </div>
                          </div>
                          {/* ROW 3 */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-12">Font</span>
                            <span className="text-xs text-gray-500 font-mono truncate">{brand.tokens.fontFamily}</span>
                          </div>
                        </div>
                        {isConfirmingDelete && (
                          <div
                            className="absolute inset-0 rounded-lg bg-red-50/95 flex flex-col items-center justify-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-label="Delete brand?"
                          >
                            <span className="text-sm text-gray-600">Delete brand?</span>
                            <div className="flex gap-2">
                              <button type="button" className="text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded border-0 cursor-pointer" onClick={() => handleDelete(brand.id)}>Yes</button>
                              <button type="button" className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 bg-transparent border-0 cursor-pointer" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* FOOTER */}
          {activeBrand && (
            <footer className="flex-shrink-0 mt-auto px-4 py-3 border-t border-gray-200" role="status">
              <span className="text-xs text-green-700">● {activeBrand.name} active</span>
            </footer>
          )}
        </>
      )}
    </div>
  );
}
