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
  const hint = disabled
    ? 'Decision locked. Waiting for others…'
    : 'Bank your gold and leave, or stay for another four choices.';
  const lines = [hint, STAY_DETAIL, EXIT_DETAIL];

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
          className="choice-btn choice-btn-stay"
          disabled={disabled}
          onClick={() => onSubmit('stay')}
        >
          <span className="choice-label">Stay</span>
          <TypewriterText
            as="span"
            className="choice-detail"
            text={STAY_DETAIL}
            speed={TYPE_SPEED}
            delay={typeDelayMs + typeDelay(lines, 1, TYPE_SPEED)}
            replayKey={`${replayKey}-stay`}
          />
        </button>
        <button
          type="button"
          className="choice-btn choice-btn-exit"
          disabled={disabled}
          onClick={() => onSubmit('exit')}
        >
          <span className="choice-label">Exit</span>
          <TypewriterText
            as="span"
            className="choice-detail"
            text={EXIT_DETAIL}
            speed={TYPE_SPEED}
            delay={typeDelayMs + typeDelay(lines, 2, TYPE_SPEED)}
            replayKey={`${replayKey}-exit`}
          />
        </button>
      </div>
    </div>
  );
}
