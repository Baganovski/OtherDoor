import { useEffect, useRef, useState } from 'react';

const TICK_MS = 100;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

interface UseSteppingValueOptions {
  /** Wait for prior stat animations before stepping. */
  start?: boolean;
  tickMs?: number;
}

/**
 * Steps a displayed number toward `target` by ±1 per tick.
 * Used for HP/gold HUD updates after round resolution.
 */
export function useSteppingValue(
  target: number,
  { start = true, tickMs = TICK_MS }: UseSteppingValueOptions = {},
): number {
  const [displayed, setDisplayed] = useState(target);
  const displayedRef = useRef(target);

  useEffect(() => {
    displayedRef.current = displayed;
  }, [displayed]);

  useEffect(() => {
    if (!start) return;

    if (prefersReducedMotion()) {
      displayedRef.current = target;
      setDisplayed(target);
      return;
    }

    let timeoutId = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      const current = displayedRef.current;
      if (current === target) return;

      const next = current < target ? current + 1 : current - 1;
      displayedRef.current = next;
      setDisplayed(next);

      if (next !== target) {
        timeoutId = window.setTimeout(step, tickMs);
      }
    };

    if (displayedRef.current !== target) {
      timeoutId = window.setTimeout(step, tickMs);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [target, start, tickMs]);

  return displayed;
}
