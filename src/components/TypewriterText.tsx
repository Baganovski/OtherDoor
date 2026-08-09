import { useEffect, useState } from 'react';

type TypewriterTag = 'p' | 'h1' | 'h2' | 'span' | 'div';

/** ms per character — deliberate, readable typing pace */
export const TYPE_SPEED = 36;
/** pause before typing begins */
export const TYPE_START_DELAY = 450;

interface TypewriterTextProps {
  text: string;
  as?: TypewriterTag;
  className?: string;
  /** Milliseconds per character. */
  speed?: number;
  /** Delay before typing starts. */
  delay?: number;
  /** When false, stays empty until true (for sequencing). */
  active?: boolean;
  /** Change this to replay the animation (e.g. screen key). */
  replayKey?: string | number;
  onComplete?: () => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function TypewriterText({
  text,
  as: Tag = 'p',
  className,
  speed = TYPE_SPEED,
  delay = 0,
  active = true,
  replayKey,
  onComplete,
}: TypewriterTextProps) {
  const [shown, setShown] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!active) {
      setShown('');
      setTyping(false);
      return;
    }

    if (prefersReducedMotion()) {
      setShown(text);
      setTyping(false);
      onComplete?.();
      return;
    }

    let cancelled = false;
    let intervalId = 0;
    setShown('');
    setTyping(true);

    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      let index = 0;

      intervalId = window.setInterval(() => {
        if (cancelled) return;
        index += 1;
        setShown(text.slice(0, index));

        if (index >= text.length) {
          window.clearInterval(intervalId);
          setTyping(false);
          onComplete?.();
        }
      }, speed);
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
    // onComplete intentionally omitted — callers should stabilize with useCallback if needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, delay, active, replayKey]);

  const classes = [className, 'typewriter', typing ? 'typewriter-typing' : 'typewriter-done']
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} aria-label={text}>
      {/* Invisible full text reserves final layout so typing doesn't shift the page */}
      <span className="typewriter-reserve" aria-hidden="true">
        {text}
      </span>
      <span className="typewriter-live" aria-hidden="true">
        {shown}
        {typing && <span className="typewriter-caret" />}
      </span>
    </Tag>
  );
}
