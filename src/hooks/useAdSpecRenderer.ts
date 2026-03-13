/**
 * useAdSpecRenderer Hook
 * 
 * React hook that manages Rive instance lifecycle and applies AdSpec configuration.
 * Recreates the Rive instance only when template (id/artboard/stateMachine) changes;
 * for spec-only updates (colors, text, stateInputs) applies to the existing instance to avoid flicker.
 */

import { useEffect, useRef, useState, type RefObject } from 'react';
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

export interface RendererOverrides {
  /** Rive file path (overrides spec.template.id lookup) */
  riveFile?: string;
  /** Artboard name (overrides spec.template.artboard) */
  artboard?: string;
}

function getTemplateKey(template: AdSpec['template'], overrides?: RendererOverrides): string {
  const artboard = overrides?.artboard ?? template.artboard;
  const riveFile = overrides?.riveFile ?? template.id;
  return `${riveFile}|${artboard}|${template.stateMachine}`;
}

function cleanupRive(ref: React.MutableRefObject<Rive | null>): void {
  if (ref.current) {
    try {
      ref.current.cleanup();
    } catch (err) {
      console.error('Error cleaning up Rive instance:', err);
    }
    ref.current = null;
  }
}

/**
 * Renders an AdSpec on a canvas using Rive
 * 
 * @param spec - AdSpec to render (null to skip rendering)
 * @param canvasRef - React ref to canvas element
 * @param overrides - Optional overrides for riveFile and artboard
 * @returns Loading state, error, and Rive instance
 */
export function useAdSpecRenderer(
  spec: AdSpec | null,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  overrides?: RendererOverrides
): UseAdSpecRendererResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [riveInstance, setRiveInstance] = useState<Rive | null>(null);
  const riveRef = useRef<Rive | null>(null);
  const templateKeyRef = useRef<string | null>(null);

  useEffect(() => {
    return () => cleanupRive(riveRef);
  }, []);

  useEffect(() => {
    if (!spec) {
      cleanupRive(riveRef);
      templateKeyRef.current = null;
      setIsLoading(false);
      setError(null);
      setRiveInstance(null);
      return;
    }

    if (!canvasRef.current) {
      console.warn('Canvas ref not ready');
      return;
    }

    const templateKey = getTemplateKey(spec.template, overrides);

    if (riveRef.current && templateKeyRef.current === templateKey) {
      applyAdSpec(riveRef.current, spec).catch((err) => {
        console.error('Failed to apply AdSpec:', err);
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to apply AdSpec configuration')
        );
      });
      return;
    }

    cleanupRive(riveRef);
    templateKeyRef.current = templateKey;
    setIsLoading(true);
    setError(null);

    let rive: Rive | null = null;

    try {
      const templatePath = overrides?.riveFile ?? getTemplatePath(spec.template.id);
      const artboardName = overrides?.artboard ?? spec.template.artboard;

      rive = new Rive({
        src: templatePath,
        canvas: canvasRef.current,
        artboard: artboardName,
        stateMachines: spec.template.stateMachine,
        autoplay: true,
        onLoad: () => {
          if (!rive) return;

          try {
            rive.resizeDrawingSurfaceToCanvas();
            riveRef.current = rive;
            setRiveInstance(rive);

            applyAdSpec(rive, spec).catch((err) => {
              console.error('Failed to apply AdSpec:', err);
              setError(
                err instanceof Error
                  ? err
                  : new Error('Failed to apply AdSpec configuration')
              );
            });

            setIsLoading(false);
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
    // Do not return a cleanup here: it would run before the next effect and destroy
    // the instance, forcing a full reload on every spec change (e.g. color drag). We
    // only cleanup on unmount (effect above) and at the start of the load path.
  }, [spec, canvasRef.current, overrides?.riveFile, overrides?.artboard]);

  return {
    isLoading,
    error,
    riveInstance,
  };
}
