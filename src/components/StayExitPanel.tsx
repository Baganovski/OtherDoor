import type { StayExitChoice } from '../types/game';

interface StayExitPanelProps {
  disabled: boolean;
  onSubmit: (choice: StayExitChoice) => void;
}

export function StayExitPanel({ disabled, onSubmit }: StayExitPanelProps) {
  return (
    <div className="choice-panel">
      <p className="choice-hint">
        {disabled
          ? 'Decision locked. Waiting for others…'
          : 'Bank your gold and leave, or stay for another four choices.'}
      </p>
      <div className="choice-grid choice-grid-two">
        <button
          type="button"
          className="choice-btn choice-btn-stay"
          disabled={disabled}
          onClick={() => onSubmit('stay')}
        >
          <span className="choice-label">Stay</span>
          <span className="choice-detail">Keep playing with your unbanked gold at risk</span>
        </button>
        <button
          type="button"
          className="choice-btn choice-btn-exit"
          disabled={disabled}
          onClick={() => onSubmit('exit')}
        >
          <span className="choice-label">Exit</span>
          <span className="choice-detail">Bank your gold and leave the run</span>
        </button>
      </div>
    </div>
  );
}
