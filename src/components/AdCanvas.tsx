/**
 * AdCanvas Component
 * 
 * Thin wrapper that renders an AdSpec on a canvas element.
 * Handles loading states and error display.
 */

import { useRef } from 'react';
import type { AdSpec } from '../types/ad-spec.schema';
import { useAdSpecRenderer } from '../hooks/useAdSpecRenderer';

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
    <div className={`relative overflow-hidden bg-[#f5f5f5] shadow-[0_4px_24px_rgba(0,0,0,0.08)] ${className}`} style={{ width, height }}>
      <canvas ref={canvasRef} width={width} height={height} className="block w-full h-full" />

      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/90 text-[#666] text-sm">
          <span>Generating...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/95 text-[#d32f2f] text-[13px] p-4">
          <span className="max-w-[90%] text-center leading-snug">{error.message}</span>
        </div>
      )}
    </div>
  );
}
