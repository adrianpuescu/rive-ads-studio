/**
 * AdCanvas Component
 * 
 * Thin wrapper that renders an AdSpec on a canvas element.
 * Handles loading states and error display.
 */

import { useRef } from 'react';
import type { AdSpec } from '../types/ad-spec.schema';
import { useAdSpecRenderer } from '../hooks/useAdSpecRenderer';
import './AdCanvas.css';

export interface AdCanvasProps {
  /** AdSpec configuration to render */
  spec: AdSpec;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** True only while a Claude API call is in progress (shows "Generating" overlay). Not tied to spec/Inspector changes. */
  isGenerating?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Renders a Rive ad based on an AdSpec
 */
export function AdCanvas({ spec, width, height, isGenerating = false, className = '' }: AdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // riveInstance exposed for parent components that need direct Rive access
  const { isLoading, error } = useAdSpecRenderer(spec, canvasRef);

  return (
    <div className={`ad-canvas-container ${className}`} style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="ad-canvas"
        style={{ display: 'block' }}
      />

      {isGenerating && (
        <div className="ad-canvas-overlay ad-canvas-loading">
          <span>Generating...</span>
        </div>
      )}

      {error && (
        <div className="ad-canvas-overlay ad-canvas-error">
          <span className="error-message">{error.message}</span>
        </div>
      )}
    </div>
  );
}
