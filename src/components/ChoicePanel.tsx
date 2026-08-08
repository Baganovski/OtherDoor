import { useEffect, useState } from 'react';
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
  const [selected, setSelected] = useState<DecisionSide | null>(null);
  const locked = disabled || selected !== null;

  useEffect(() => {
    setSelected(null);
  }, [replayKey, card.id]);

  const handleSelect = (choice: DecisionSide) => {
    if (locked) return;
    setSelected(choice);
    onSubmit(choice);
  };

  const hint = locked
    ? selected
      ? `Selection made: ${selected.toUpperCase()}. Waiting for other players…`
      : 'Selection made. Waiting for other players…'
    : 'Tap a decision to lock it in.';

  const lines = [hint, card.optionA.label, card.optionB.label];

  return (
    <div className={`choice-panel${locked ? ' choice-panel-locked' : ''}`}>
      {locked ? (
        <p className="choice-hint">{hint}</p>
      ) : (
        <TypewriterText
          as="p"
          className="choice-hint"
          text={hint}
          speed={TYPE_SPEED}
          delay={typeDelayMs + typeDelay(lines, 0, TYPE_SPEED)}
          replayKey={`${replayKey}-hint`}
        />
      )}
      <div className="choice-grid choice-grid-two">
        <button
          type="button"
          className={`choice-btn${selected === 'a' ? ' choice-btn-selected' : ''}${locked && selected !== 'a' ? ' choice-btn-dimmed' : ''}`}
          disabled={locked}
          onClick={() => handleSelect('a')}
        >
          <span className="choice-label">
            A
            {selected === 'a' && <span className="choice-selected-tag">Selected</span>}
          </span>
          {locked ? (
            <span className="choice-detail">{card.optionA.label}</span>
          ) : (
            <TypewriterText
              as="span"
              className="choice-detail"
              text={card.optionA.label}
              speed={TYPE_SPEED}
              delay={typeDelayMs + typeDelay(lines, 1, TYPE_SPEED)}
              replayKey={`${replayKey}-a`}
            />
          )}
        </button>
        <button
          type="button"
          className={`choice-btn${selected === 'b' ? ' choice-btn-selected' : ''}${locked && selected !== 'b' ? ' choice-btn-dimmed' : ''}`}
          disabled={locked}
          onClick={() => handleSelect('b')}
        >
          <span className="choice-label">
            B
            {selected === 'b' && <span className="choice-selected-tag">Selected</span>}
          </span>
          {locked ? (
            <span className="choice-detail">{card.optionB.label}</span>
          ) : (
            <TypewriterText
              as="span"
              className="choice-detail"
              text={card.optionB.label}
              speed={TYPE_SPEED}
              delay={typeDelayMs + typeDelay(lines, 2, TYPE_SPEED)}
              replayKey={`${replayKey}-b`}
            />
          )}
        </button>
      </div>
    </div>
  );
}
