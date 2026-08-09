import { useEffect, useRef, useState } from 'react';

const FLASH_HOLD_MS = 2000;

export type StatFlash = 'up' | 'down' | null;

/**
 * Returns a short-lived flash direction when `value` changes,
 * clearing after FLASH_HOLD_MS so CSS can fade back to the default color.
 */
export function useStatFlash(value: number): StatFlash {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<StatFlash>(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (value === prev) return;

    prevRef.current = value;
    setFlash(value > prev ? 'up' : 'down');

    const timeoutId = window.setTimeout(() => {
      setFlash(null);
    }, FLASH_HOLD_MS);

    return () => window.clearTimeout(timeoutId);
  }, [value]);

  return flash;
}
