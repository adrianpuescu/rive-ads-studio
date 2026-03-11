/**
 * VariantsModal — full-screen modal to choose one of 3 AI-generated ad variants.
 * Shows static preview (no Rive), style badge, and "Use this variant" / Retry.
 */

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
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
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 animate-skeleton">
      <div className="h-[120px] bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 rounded" />
      </div>
      <div className="p-3 border-t border-gray-200">
        <div className="h-9 w-full bg-gray-200 rounded" />
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
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex flex-col">
        <div className="h-[120px] flex items-center justify-center text-gray-500 text-sm">
          Generation failed
        </div>
        <div className="p-4 flex-1" />
        <div className="p-3 border-t border-gray-200">
          <button
            type="button"
            className="w-full h-9 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors duration-150"
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
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col hover:border-gray-300 hover:shadow-sm transition-all duration-150">
      <div className="h-[120px] flex-shrink-0">
        <StaticPreview spec={spec} />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <span className="inline-flex w-fit text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
          {label}
        </span>
        <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
          {spec.text?.headline?.value ?? '—'}
        </p>
        <p className="text-sm text-gray-500 leading-tight line-clamp-2">
          {spec.text?.subheadline?.value ?? '—'}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="w-4 h-4 rounded-full ring-1 ring-black/10 flex-shrink-0"
            style={{ background: bgColor }}
            title="Background"
          />
          <span
            className="w-4 h-4 rounded-full ring-1 ring-black/10 flex-shrink-0"
            style={{ background: primaryColor }}
            title="Primary"
          />
          <span
            className="w-4 h-4 rounded-full ring-1 ring-black/10 flex-shrink-0"
            style={{ background: headlineColor }}
            title="Headline"
          />
        </div>
        {spec.text?.cta?.value && (
          <p className="text-xs italic text-gray-400">
            {spec.text.cta.value}
          </p>
        )}
      </div>
      <div className="p-3 mt-auto border-t border-gray-200">
        <button
          type="button"
          className="w-full h-9 text-sm font-medium text-white bg-gray-900 border-0 rounded cursor-pointer transition-colors duration-150 hover:bg-gray-700"
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
        className="absolute inset-0 bg-black/60 cursor-default"
        onClick={() => !isGenerating && onClose()}
        aria-label="Close modal"
      />
      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="min-w-0">
            <h2 id="variants-modal-title" className="text-base font-semibold text-gray-900 m-0">
              Choose a variant
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 m-0 truncate">
              {truncatedPrompt || '—'}
            </p>
          </div>
          <button
            type="button"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 bg-transparent border-0 rounded cursor-pointer hover:bg-gray-50 transition-colors duration-150"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-8">
          {isGenerating ? (
            <>
              <p className="text-sm text-gray-500 mb-4">Generating 3 variants...</p>
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
