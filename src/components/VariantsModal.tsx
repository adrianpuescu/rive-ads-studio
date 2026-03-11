/**
 * VariantsModal — full-screen modal to choose one of 3 AI-generated ad variants.
 * Shows static preview (no Rive), style badge, and "Use this variant" / Retry.
 */

import { useEffect, useCallback } from 'react';
import type { AdSpec } from '../types/ad-spec.schema';
import { VARIANT_STYLE_LABELS } from '../ai/specGenerator';

export interface VariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  variants: (AdSpec | null)[];
  isGenerating: boolean;
  onSelectVariant: (spec: AdSpec) => void;
  /** Called when user picks a variant; use to e.g. initialize chat history for refinement. */
  onVariantSelected?: (variant: AdSpec, prompt: string) => void;
  onRetryVariant: (index: number) => void;
}

function StaticPreview({ spec }: { spec: AdSpec }) {
  const bg = spec.colors?.background ?? '#ffffff';
  const headlineColor = spec.colors?.headlineColor ?? '#111827';
  const subheadlineColor = spec.colors?.subheadlineColor ?? '#6b7280';
  const ctaColor = spec.colors?.ctaColor ?? '#374151';
  const headline = spec.text?.headline?.value ?? '';
  const subheadline = spec.text?.subheadline?.value ?? '';
  const cta = spec.text?.cta?.value ?? '';

  return (
    <div
      className="w-full h-full flex items-center justify-between px-3 gap-2 bg-[var(--preview-bg)]"
      style={{ ['--preview-bg' as string]: bg }}
    >
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        {headline && (
          <span
            className="font-sans font-bold truncate leading-tight text-[0.65rem] text-[var(--preview-headline)]"
            style={{ ['--preview-headline' as string]: headlineColor }}
          >
            {headline}
          </span>
        )}
        {subheadline && (
          <span
            className="font-sans truncate leading-tight text-[0.55rem] text-[var(--preview-subheadline)]"
            style={{ ['--preview-subheadline' as string]: subheadlineColor }}
          >
            {subheadline}
          </span>
        )}
      </div>
      {cta && (
        <span
          className="font-sans font-medium flex-shrink-0 text-[0.6rem] text-[var(--preview-cta)]"
          style={{ ['--preview-cta' as string]: ctaColor }}
        >
          {cta}
        </span>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden border-[1.5px] border-[#e5e5e5] bg-[#f5f5f5] animate-skeleton">
      <div className="h-[120px] bg-[#e8e8e8]" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-16 bg-[#e0e0e0] rounded" />
        <div className="h-3 w-full bg-[#e0e0e0] rounded" />
        <div className="h-3 w-3/4 bg-[#e0e0e0] rounded" />
      </div>
      <div className="p-3 border-t border-[#e5e5e5]">
        <div className="h-9 w-full bg-[#e0e0e0] rounded" />
      </div>
    </div>
  );
}

function VariantCard({
  spec,
  index,
  onSelect,
  onRetry,
}: {
  spec: AdSpec | null;
  index: number;
  onSelect: (s: AdSpec) => void;
  onRetry: (i: number) => void;
}) {
  const label = VARIANT_STYLE_LABELS[index] ?? `Variant ${index + 1}`;

  if (spec === null) {
    return (
      <div className="rounded-lg overflow-hidden border-[1.5px] border-[#e5e5e5] bg-[#f0f0f0] flex flex-col">
        <div className="h-[120px] flex items-center justify-center text-[#666] font-sans text-sm">
          Generation failed
        </div>
        <div className="p-4 flex-1" />
        <div className="p-3 border-t border-[#e5e5e5]">
          <button
            type="button"
            className="w-full h-9 font-sans font-medium text-sm text-text-primary bg-transparent border border-[#0d0c0a] rounded cursor-pointer hover:bg-[#e5e5e5] transition-colors duration-150"
            onClick={() => onRetry(index)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const primaryColor = spec.colors?.primary ?? '#000000';
  const headlineColor = spec.colors?.headlineColor ?? '#111827';
  const bgColor = spec.colors?.background ?? '#ffffff';

  return (
    <div className="rounded-lg overflow-hidden border-[1.5px] border-[#e5e5e5] bg-white flex flex-col hover:border-[#0d0c0a] transition-all duration-150 hover:shadow-sm">
      <div className="h-[120px] flex-shrink-0">
        <StaticPreview spec={spec} />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <span className="inline-flex w-fit font-sans text-[0.7rem] font-medium px-2 py-0.5 rounded bg-[#f0f0f0] text-text-primary">
          {label}
        </span>
        <p className="font-sans font-bold text-sm text-text-primary leading-tight truncate">
          {spec.text?.headline?.value ?? '—'}
        </p>
        <p className="font-sans text-[0.85rem] text-[#666] leading-tight line-clamp-2">
          {spec.text?.subheadline?.value ?? '—'}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border border-[#ddd] flex-shrink-0 bg-[var(--dot-bg)]"
            style={{ ['--dot-bg' as string]: bgColor }}
            title="Background"
          />
          <span
            className="w-3 h-3 rounded-full border border-[#ddd] flex-shrink-0 bg-[var(--dot-primary)]"
            style={{ ['--dot-primary' as string]: primaryColor }}
            title="Primary"
          />
          <span
            className="w-3 h-3 rounded-full border border-[#ddd] flex-shrink-0 bg-[var(--dot-headline)]"
            style={{ ['--dot-headline' as string]: headlineColor }}
            title="Headline"
          />
        </div>
        {spec.text?.cta?.value && (
          <p className="font-sans text-[0.8rem] italic text-[#999]">
            {spec.text.cta.value}
          </p>
        )}
      </div>
      <div className="p-3 mt-auto border-t border-[#e5e5e5]">
        <button
          type="button"
          className="w-full h-9 font-sans font-medium text-sm text-white bg-text-primary border-0 rounded cursor-pointer transition-colors duration-150 hover:bg-[#374151]"
          onClick={() => onSelect(spec)}
        >
          Use this variant
        </button>
      </div>
    </div>
  );
}

export function VariantsModal({
  isOpen,
  onClose,
  prompt,
  variants,
  isGenerating,
  onSelectVariant,
  onVariantSelected,
  onRetryVariant,
}: VariantsModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isGenerating) {
        onClose();
      }
    },
    [isOpen, isGenerating, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const truncatedPrompt = prompt.length > 80 ? prompt.slice(0, 77) + '...' : prompt;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="variants-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 cursor-default"
        onClick={() => !isGenerating && onClose()}
        aria-label="Close modal"
      />
      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex items-start justify-between gap-4 p-6 pb-4 border-b border-[#e5e5e5]">
          <div className="min-w-0">
            <h2 id="variants-modal-title" className="font-sans text-lg font-semibold text-text-primary m-0">
              Choose a variant
            </h2>
            <p className="font-sans text-sm text-[#666] mt-1 m-0 truncate">
              {truncatedPrompt || '—'}
            </p>
          </div>
          <button
            type="button"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-text-primary bg-transparent border-0 rounded cursor-pointer hover:bg-[#f0f0f0] transition-colors duration-150 text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-8">
          {isGenerating ? (
            <>
              <p className="font-sans text-sm text-[#666] mb-4">Generating 3 variants...</p>
              <div className="grid grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <VariantCard
                  key={i}
                  spec={variants[i] ?? null}
                  index={i}
                  onSelect={(spec) => {
                    onSelectVariant(spec);
                    onVariantSelected?.(spec, prompt);
                  }}
                  onRetry={onRetryVariant}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
