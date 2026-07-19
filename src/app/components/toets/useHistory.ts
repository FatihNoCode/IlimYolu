import { useState, useCallback, useRef } from 'react';

// Small undo/redo history over an immutable draft state. Every `set` pushes a
// snapshot; undo/redo walk the stack (capped so a long editing session can't
// grow unbounded).
export function useHistory<T>(initial: T, cap = 50) {
  const [state, setState] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const baseline = useRef<T | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, bump] = useState(0);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => {
      past.current.push(prev);
      if (past.current.length > cap) past.current.shift();
      future.current = [];
      bump((n) => n + 1);
      return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
    });
  }, [cap]);

  // Pushes the pre-edit snapshot as a single undo step, if one is pending.
  const commitLive = useCallback(() => {
    if (debounceTimer.current) { clearTimeout(debounceTimer.current); debounceTimer.current = null; }
    if (baseline.current === null) return;
    past.current.push(baseline.current);
    if (past.current.length > cap) past.current.shift();
    future.current = [];
    baseline.current = null;
    bump((n) => n + 1);
  }, [cap]);

  // Live updates: change visible state immediately but checkpoint history
  // only after a short pause (or on commitLive/blur) — so typing a sentence
  // in a text field is one undo step, not one per keystroke.
  const setLive = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => {
      if (baseline.current === null) baseline.current = prev;
      return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
    });
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(commitLive, 600);
  }, [commitLive]);

  const undo = useCallback(() => {
    commitLive();
    setState((prev) => {
      const last = past.current.pop();
      if (last === undefined) return prev;
      future.current.push(prev);
      bump((n) => n + 1);
      return last;
    });
  }, [commitLive]);

  const redo = useCallback(() => {
    setState((prev) => {
      const next = future.current.pop();
      if (next === undefined) return prev;
      past.current.push(prev);
      bump((n) => n + 1);
      return next;
    });
  }, []);

  const reset = useCallback((value: T) => {
    past.current = [];
    future.current = [];
    baseline.current = null;
    setState(value);
    bump((n) => n + 1);
  }, []);

  return {
    state, set, setLive, commitLive, undo, redo, reset,
    canUndo: past.current.length > 0 || baseline.current !== null,
    canRedo: future.current.length > 0,
  };
}
