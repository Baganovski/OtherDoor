import type { DecisionSide } from '../types/game';
import type { DealtCard } from '../types/game';
import { TypewriterText, TYPE_SPEED, typeDelay } from './TypewriterText';

interface ChoicePanelProps {
  card: DealtCard;
  disabled: boolean;
  onSubmit: (choice: DecisionSide) => void;
  typeDelayMs?: number;
  replayKey?: string | number;
}

export function ChoicePanel({
  card,
  disabled,
  onSubmit,
  typeDelayMs = 0,
  replayKey,
}: ChoicePanelProps) {
  const hint = disabled
    ? 'Choice locked. Waiting for others…'
    : 'Tap a decision to lock it in.';
  const lines = [hint, card.optionA.label, card.optionB.label];

  return (
    <div className="choice-panel">
      <TypewriterText
        as="p"
        className="choice-hint"
        text={hint}
        speed={TYPE_SPEED}
        delay={typeDelayMs + typeDelay(lines, 0, TYPE_SPEED)}
        replayKey={`${replayKey}-${hint}`}
      />
      <div className="choice-grid choice-grid-two">
        <button
          type="button"
          className="choice-btn"
          disabled={disabled}
          onClick={() => onSubmit('a')}
        >
          <span className="choice-label">A</span>
          <TypewriterText
            as="span"
            className="choice-detail"
            text={card.optionA.label}
            speed={TYPE_SPEED}
            delay={typeDelayMs + typeDelay(lines, 1, TYPE_SPEED)}
            replayKey={`${replayKey}-a`}
          />
        </button>
        <button
          type="button"
          className="choice-btn"
          disabled={disabled}
          onClick={() => onSubmit('b')}
        >
          <span className="choice-label">B</span>
          <TypewriterText
            as="span"
            className="choice-detail"
            text={card.optionB.label}
            speed={TYPE_SPEED}
            delay={typeDelayMs + typeDelay(lines, 2, TYPE_SPEED)}
            replayKey={`${replayKey}-b`}
          />
        </button>
      </div>
    </div>
  );
}
