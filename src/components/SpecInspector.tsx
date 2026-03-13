/**
 * SpecInspector Component
 * 
 * Displays and allows live editing of AdSpec configuration.
 * Changes are immediately reflected in the preview.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { AdSpec } from '../types/ad-spec.schema';

export interface SpecInspectorProps {
  spec: AdSpec;
  onChange: (updated: AdSpec) => void;
  projectName?: string | null;
  onProjectNameChange?: (newName: string) => void;
}

export function SpecInspector({ spec, onChange, projectName, onProjectNameChange }: SpecInspectorProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameValueRef = useRef('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    renameValueRef.current = renameValue;
  }, [renameValue]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameStart = useCallback(() => {
    if (projectName === null || projectName === undefined) return;
    setRenameValue(projectName);
    setIsRenaming(true);
  }, [projectName]);

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameValueRef.current.trim();
    if (trimmed && onProjectNameChange) {
      onProjectNameChange(trimmed);
    }
    setIsRenaming(false);
  }, [onProjectNameChange]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRenameSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsRenaming(false);
      }
    },
    [handleRenameSubmit]
  );
  const handleTextChange = (field: 'headline' | 'subheadline' | 'cta', value: string) => {
    onChange({
      ...spec,
      text: {
        ...spec.text,
        [field]: {
          ...spec.text[field],
          value,
        },
      },
    });
  };

  const handleColorChange = (
    field: 'background' | 'primary' | 'secondary' | 'headlineColor' | 'subheadlineColor' | 'ctaColor',
    value: string
  ) => {
    onChange({
      ...spec,
      colors: {
        ...spec.colors,
        [field]: value,
      },
    });
  };

  const sectionLabel = 'text-xs font-semibold text-gray-400 uppercase tracking-wider m-0 pb-2 border-b border-gray-200';
  const fieldLabel = 'text-xs text-gray-500';
  const fieldInput = 'w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 bg-white transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400';
  const colorRow = 'flex items-center gap-2';
  const colorInput = 'w-8 h-8 p-0.5 border border-gray-200 rounded cursor-pointer bg-transparent flex-shrink-0';
  const colorHex = 'text-xs font-mono text-gray-500';
  const colorHexInput = 'flex-1 min-w-0 border border-gray-200 rounded px-3 py-2 text-xs font-mono text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900';

  return (
    <div className="flex flex-col gap-6 mt-3">
      {/* PROJECT NAME SECTION */}
      {projectName !== null && projectName !== undefined && (
        <div className="flex flex-col gap-3">
          <h3 className={sectionLabel}>Project name</h3>
          <div className="flex flex-col gap-1">
            {isRenaming ? (
              <input
                ref={inputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleRenameSubmit}
                className={fieldInput}
              />
            ) : (
              <button
                type="button"
                onClick={handleRenameStart}
                className="w-full text-left text-sm text-gray-900 px-3 py-2 border border-gray-200 rounded bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-150 truncate"
                title="Click to rename"
              >
                {projectName}
              </button>
            )}
          </div>
        </div>
      )}

      {/* TEXT SECTION */}
      <div className="flex flex-col gap-3">
        <h3 className={sectionLabel}>Text</h3>
        {spec.text.headline?.value !== undefined && (
          <div className="flex flex-col gap-1">
            <label className={fieldLabel}>Headline</label>
            <input
              type="text"
              className={fieldInput}
              value={spec.text.headline.value}
              onChange={(e) => handleTextChange('headline', e.target.value)}
            />
          </div>
        )}
        {spec.text.subheadline?.value !== undefined && (
          <div className="flex flex-col gap-1">
            <label className={fieldLabel}>Subheadline</label>
            <input
              type="text"
              className={fieldInput}
              value={spec.text.subheadline.value}
              onChange={(e) => handleTextChange('subheadline', e.target.value)}
            />
          </div>
        )}
        {spec.text.cta?.value !== undefined && (
          <div className="flex flex-col gap-1">
            <label className={fieldLabel}>CTA</label>
            <input
              type="text"
              className={fieldInput}
              value={spec.text.cta.value}
              onChange={(e) => handleTextChange('cta', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* COLORS SECTION */}
      <div className="flex flex-col gap-3">
        <h3 className={sectionLabel}>Colors</h3>
        <div className="flex flex-col gap-1">
          <label className={fieldLabel}>Background</label>
          <div className={colorRow}>
            <input type="color" className={colorInput} value={spec.colors.background} onChange={(e) => handleColorChange('background', e.target.value)} />
            <span className={colorHex}>{spec.colors.background}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className={fieldLabel}>Primary</label>
          <div className={colorRow}>
            <input type="color" className={colorInput} value={spec.colors.primary} onChange={(e) => handleColorChange('primary', e.target.value)} />
            <span className={colorHex}>{spec.colors.primary}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className={fieldLabel}>Secondary</label>
          <div className={colorRow}>
            <input type="color" className={colorInput} value={spec.colors.secondary} onChange={(e) => handleColorChange('secondary', e.target.value)} />
            <span className={colorHex}>{spec.colors.secondary}</span>
          </div>
        </div>
      </div>

      {/* TEXT COLORS SECTION */}
      <div className="flex flex-col gap-3">
        <h3 className={sectionLabel}>Text Colors</h3>
        <div className="flex flex-col gap-1">
          <label className={fieldLabel}>Headline Color</label>
          <div className={colorRow}>
            <input type="color" className={colorInput} value={spec.colors.headlineColor ?? '#000000'} onChange={(e) => handleColorChange('headlineColor', e.target.value)} />
            <input type="text" className={colorHexInput} value={spec.colors.headlineColor ?? '#000000'} onChange={(e) => handleColorChange('headlineColor', e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className={fieldLabel}>Subheadline Color</label>
          <div className={colorRow}>
            <input type="color" className={colorInput} value={spec.colors.subheadlineColor ?? '#333333'} onChange={(e) => handleColorChange('subheadlineColor', e.target.value)} />
            <input type="text" className={colorHexInput} value={spec.colors.subheadlineColor ?? '#333333'} onChange={(e) => handleColorChange('subheadlineColor', e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className={fieldLabel}>CTA Color</label>
          <div className={colorRow}>
            <input type="color" className={colorInput} value={spec.colors.ctaColor ?? '#ffffff'} onChange={(e) => handleColorChange('ctaColor', e.target.value)} />
            <input type="text" className={colorHexInput} value={spec.colors.ctaColor ?? '#ffffff'} onChange={(e) => handleColorChange('ctaColor', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
