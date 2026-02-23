/**
 * useAdSpecRenderer Hook
 * 
 * React hook that manages Rive instance lifecycle and applies AdSpec configuration.
 * Handles loading, errors, and cleanup automatically.
 */

import { useEffect, useState, type RefObject } from 'react';
import { Rive } from '@rive-app/canvas';
import type { AdSpec } from '../types/ad-spec.schema';
import { getTemplatePath } from '../lib/templateRegistry';
import { applyAdSpec } from '../lib/riveApplier';

export interface UseAdSpecRendererResult {
  /** True while Rive file is loading */
  isLoading: boolean;
  /** Error if loading or applying spec failed */
  error: Error | null;
  /** Live Rive instance (null until loaded) */
  riveInstance: Rive | null;
}

/**
 * Renders an AdSpec on a canvas using Rive
 * 
 * @param spec - AdSpec to render (null to skip rendering)
 * @param canvasRef - React ref to canvas element
 * @returns Loading state, error, and Rive instance
 */
export function useAdSpecRenderer(
  spec: AdSpec | null,
  canvasRef: RefObject<HTMLCanvasElement | null>
): UseAdSpecRendererResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [riveInstance, setRiveInstance] = useState<Rive | null>(null);

  useEffect(() => {
    // No spec provided - idle state
    if (!spec) {
      setIsLoading(false);
      setError(null);
      setRiveInstance(null);
      return;
    }

    // No canvas element yet
    if (!canvasRef.current) {
      console.warn('Canvas ref not ready');
      return;
    }

    setIsLoading(true);
    setError(null);

    let rive: Rive | null = null;

    try {
      const templatePath = getTemplatePath(spec.template.id);

      // Instantiate Rive with manual control
      rive = new Rive({
        src: templatePath,
        canvas: canvasRef.current,
        artboard: spec.template.artboard,
        stateMachines: spec.template.stateMachine,
        autoplay: true,
        onLoad: () => {
          if (!rive) return;

          try {
            // Resize canvas to match dimensions
            rive.resizeDrawingSurfaceToCanvas();

            // Apply AdSpec configuration
            applyAdSpec(rive, spec).catch((err) => {
              console.error('Failed to apply AdSpec:', err);
              setError(
                err instanceof Error
                  ? err
                  : new Error('Failed to apply AdSpec configuration')
              );
            });

            setIsLoading(false);
            setRiveInstance(rive);
          } catch (err) {
            console.error('Error in Rive onLoad:', err);
            setError(
              err instanceof Error ? err : new Error('Failed to initialize Rive')
            );
            setIsLoading(false);
          }
        },
        onLoadError: () => {
          setError(new Error('Failed to load Rive file'));
          setIsLoading(false);
        },
      });
    } catch (err) {
      console.error('Failed to instantiate Rive:', err);
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to instantiate Rive instance')
      );
      setIsLoading(false);
    }

    // Cleanup on unmount or spec change
    return () => {
      if (rive) {
        try {
          rive.cleanup();
        } catch (err) {
          console.error('Error cleaning up Rive instance:', err);
        }
      }
    };
  }, [spec, canvasRef.current]);

  return {
    isLoading,
    error,
    riveInstance,
  };
}
