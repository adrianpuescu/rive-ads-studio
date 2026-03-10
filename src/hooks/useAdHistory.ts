/**
 * useAdHistory — undo/redo for AdSpec iterations.
 * History is in-memory only (no localStorage); resets on refresh.
 */

import { useState, useCallback } from 'react';
import type { AdSpec } from '../types/ad-spec.schema';

const MAX_PAST = 20;

export interface AdHistoryState {
  past: AdSpec[];
  present: AdSpec | null;
  future: AdSpec[];
}

export function useAdHistory(initial: AdSpec | null = null): {
  present: AdSpec | null;
  canUndo: boolean;
  canRedo: boolean;
  push: (spec: AdSpec) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  replacePresent: (spec: AdSpec) => void;
} {
  const [state, setState] = useState<AdHistoryState>({
    past: [],
    present: initial,
    future: [],
  });

  const push = useCallback((spec: AdSpec) => {
    setState((prev) => {
      const nextPast = [...prev.past];
      if (prev.present != null) {
        nextPast.push(prev.present);
        if (nextPast.length > MAX_PAST) nextPast.shift();
      }
      return {
        past: nextPast,
        present: spec,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      const nextPast = [...prev.past];
      const previous = nextPast.pop()!;
      const nextFuture = prev.present != null ? [prev.present, ...prev.future] : [...prev.future];
      return {
        past: nextPast,
        present: previous,
        future: nextFuture,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      const nextFuture = [...prev.future];
      const nextPresent = nextFuture.shift()!;
      const nextPast = prev.present != null ? [...prev.past, prev.present] : [...prev.past];
      return {
        past: nextPast,
        present: nextPresent,
        future: nextFuture,
      };
    });
  }, []);

  const clear = useCallback(() => {
    setState({ past: [], present: null, future: [] });
  }, []);

  /** Replace current state without adding to history (e.g. transient inspector edits). */
  const replacePresent = useCallback((spec: AdSpec) => {
    setState((prev) => ({ ...prev, present: spec }));
  }, []);

  return {
    present: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    push,
    undo,
    redo,
    clear,
    replacePresent,
  };
}
