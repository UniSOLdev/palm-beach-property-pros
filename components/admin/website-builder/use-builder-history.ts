"use client";

import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 50;

export function useBuilderHistory<T>(initial: T) {
  const [present, setPresent] = useState(initial);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const push = useCallback(
    (next: T) => {
      pastRef.current = [...pastRef.current.slice(-MAX_HISTORY + 1), present];
      futureRef.current = [];
      setPresent(next);
      syncFlags();
    },
    [present, syncFlags],
  );

  const replace = useCallback(
    (next: T) => {
      setPresent(next);
      syncFlags();
    },
    [syncFlags],
  );

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (!past.length) return;
    const prev = past[past.length - 1];
    pastRef.current = past.slice(0, -1);
    futureRef.current = [present, ...futureRef.current];
    setPresent(prev);
    syncFlags();
  }, [present, syncFlags]);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (!future.length) return;
    const next = future[0];
    futureRef.current = future.slice(1);
    pastRef.current = [...pastRef.current, present];
    setPresent(next);
    syncFlags();
  }, [present, syncFlags]);

  const reset = useCallback(
    (next: T) => {
      pastRef.current = [];
      futureRef.current = [];
      setPresent(next);
      syncFlags();
    },
    [syncFlags],
  );

  return { state: present, push, replace, undo, redo, reset, canUndo, canRedo };
}

export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delayMs: number,
): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delayMs);
    }) as T,
    [delayMs],
  );
}
