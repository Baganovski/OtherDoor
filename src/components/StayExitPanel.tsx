import { useEffect, useState } from 'react';
import type { StayExitChoice } from '../types/game';
import { TypewriterText, TYPE_SPEED, typeDelay } from './TypewriterText';

interface StayExitPanelProps {
  disabled: boolean;
  onSubmit: (choice: StayExitChoice) => void;
  typeDelayMs?: number;
  replayKey?: string | number;
}

const STAY_DETAIL = 'Keep playing with your unbanked gold at risk';
const EXIT_DETAIL = 'Bank your gold and leave the run';

export function StayExitPanel({
  disabled,
  onSubmit,
  typeDelayMs = 0,
  replayKey,
}: StayExitPanelProps) {
  const [selected, setSelected] = useState<StayExitChoice | null>(null);
  const locked = disabled || selected !== null;

  useEffect(() => {
    setSelected(null);
  }, [replayKey]);

  const handleSelect = (choice: StayExitChoice) => {
    if (locked) return;
    setSelected(choice);
    onSubmit(choice);
  };

  const hint = locked
    ? selected
      ? `Selection made: ${selected === 'stay' ? 'Stay' : 'Exit'}. Waiting for other players…`
      : 'Selection made. Waiting for other players…'
    : 'Bank your gold and leave, or stay for another four choices.';

  const lines = [hint, STAY_DETAIL, EXIT_DETAIL];

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
          className={`choice-btn choice-btn-stay${selected === 'stay' ? ' choice-btn-selected' : ''}${locked && selected !== 'stay' ? ' choice-btn-dimmed' : ''}`}
          disabled={locked}
          onClick={() => handleSelect('stay')}
        >
          <span className="choice-label">
            Stay
            {selected === 'stay' && <span className="choice-selected-tag">Selected</span>}
          </span>
          {locked ? (
            <span className="choice-detail">{STAY_DETAIL}</span>
          ) : (
            <TypewriterText
              as="span"
              className="choice-detail"
              text={STAY_DETAIL}
              speed={TYPE_SPEED}
              delay={typeDelayMs + typeDelay(lines, 1, TYPE_SPEED)}
              replayKey={`${replayKey}-stay`}
            />
          )}
        </button>
        <button
          type="button"
          className={`choice-btn choice-btn-exit${selected === 'exit' ? ' choice-btn-selected' : ''}${locked && selected !== 'exit' ? ' choice-btn-dimmed' : ''}`}
          disabled={locked}
          onClick={() => handleSelect('exit')}
        >
          <span className="choice-label">
            Exit
            {selected === 'exit' && <span className="choice-selected-tag">Selected</span>}
          </span>
          {locked ? (
            <span className="choice-detail">{EXIT_DETAIL}</span>
          ) : (
            <TypewriterText
              as="span"
              className="choice-detail"
              text={EXIT_DETAIL}
              speed={TYPE_SPEED}
              delay={typeDelayMs + typeDelay(lines, 2, TYPE_SPEED)}
              replayKey={`${replayKey}-exit`}
            />
          )}
        </button>
      </div>
    </div>
  );
}
