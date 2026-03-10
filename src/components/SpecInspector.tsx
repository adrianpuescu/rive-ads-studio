/**
 * SpecInspector Component
 * 
 * Displays and allows live editing of AdSpec configuration.
 * Changes are immediately reflected in the preview.
 */

import type { AdSpec } from '../types/ad-spec.schema';

export interface SpecInspectorProps {
  spec: AdSpec;
  onChange: (updated: AdSpec) => void;
}

export function SpecInspector({ spec, onChange }: SpecInspectorProps) {
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

  return (
    <div className="spec-inspector">
      {/* TEXT SECTION */}
      <div className="inspector-section">
        <h3 className="inspector-section-label">Text</h3>
        
        {spec.text.headline?.value !== undefined && (
          <div className="inspector-field">
            <label className="inspector-field-label">Headline</label>
            <input
              type="text"
              className="inspector-field-input"
              value={spec.text.headline.value}
              onChange={(e) => handleTextChange('headline', e.target.value)}
            />
          </div>
        )}

        {spec.text.subheadline?.value !== undefined && (
          <div className="inspector-field">
            <label className="inspector-field-label">Subheadline</label>
            <input
              type="text"
              className="inspector-field-input"
              value={spec.text.subheadline.value}
              onChange={(e) => handleTextChange('subheadline', e.target.value)}
            />
          </div>
        )}

        {spec.text.cta?.value !== undefined && (
          <div className="inspector-field">
            <label className="inspector-field-label">CTA</label>
            <input
              type="text"
              className="inspector-field-input"
              value={spec.text.cta.value}
              onChange={(e) => handleTextChange('cta', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* COLORS SECTION */}
      <div className="inspector-section">
        <h3 className="inspector-section-label">Colors</h3>
        
        <div className="inspector-field">
          <label className="inspector-field-label">Background</label>
          <div className="inspector-color-row">
            <input
              type="color"
              className="inspector-color-input"
              value={spec.colors.background}
              onChange={(e) => handleColorChange('background', e.target.value)}
            />
            <span className="inspector-color-hex">{spec.colors.background}</span>
          </div>
        </div>

        <div className="inspector-field">
          <label className="inspector-field-label">Primary</label>
          <div className="inspector-color-row">
            <input
              type="color"
              className="inspector-color-input"
              value={spec.colors.primary}
              onChange={(e) => handleColorChange('primary', e.target.value)}
            />
            <span className="inspector-color-hex">{spec.colors.primary}</span>
          </div>
        </div>

        <div className="inspector-field">
          <label className="inspector-field-label">Secondary</label>
          <div className="inspector-color-row">
            <input
              type="color"
              className="inspector-color-input"
              value={spec.colors.secondary}
              onChange={(e) => handleColorChange('secondary', e.target.value)}
            />
            <span className="inspector-color-hex">{spec.colors.secondary}</span>
          </div>
        </div>
      </div>

      {/* TEXT COLORS SECTION */}
      <div className="inspector-section">
        <h3 className="inspector-section-label">Text Colors</h3>

        <div className="inspector-field">
          <label className="inspector-field-label">Headline Color</label>
          <div className="inspector-color-row">
            <input
              type="color"
              className="inspector-color-input"
              value={spec.colors.headlineColor ?? '#000000'}
              onChange={(e) => handleColorChange('headlineColor', e.target.value)}
            />
            <input
              type="text"
              className="inspector-color-hex-input"
              value={spec.colors.headlineColor ?? '#000000'}
              onChange={(e) => handleColorChange('headlineColor', e.target.value)}
            />
          </div>
        </div>

        <div className="inspector-field">
          <label className="inspector-field-label">Subheadline Color</label>
          <div className="inspector-color-row">
            <input
              type="color"
              className="inspector-color-input"
              value={spec.colors.subheadlineColor ?? '#333333'}
              onChange={(e) => handleColorChange('subheadlineColor', e.target.value)}
            />
            <input
              type="text"
              className="inspector-color-hex-input"
              value={spec.colors.subheadlineColor ?? '#333333'}
              onChange={(e) => handleColorChange('subheadlineColor', e.target.value)}
            />
          </div>
        </div>

        <div className="inspector-field">
          <label className="inspector-field-label">CTA Color</label>
          <div className="inspector-color-row">
            <input
              type="color"
              className="inspector-color-input"
              value={spec.colors.ctaColor ?? '#ffffff'}
              onChange={(e) => handleColorChange('ctaColor', e.target.value)}
            />
            <input
              type="text"
              className="inspector-color-hex-input"
              value={spec.colors.ctaColor ?? '#ffffff'}
              onChange={(e) => handleColorChange('ctaColor', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
