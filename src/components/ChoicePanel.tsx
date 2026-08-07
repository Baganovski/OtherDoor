import type { DecisionSide } from '../types/game';
import type { DealtCard } from '../types/game';

interface ChoicePanelProps {
  card: DealtCard;
  disabled: boolean;
  onSubmit: (choice: DecisionSide) => void;
}

export function ChoicePanel({ card, disabled, onSubmit }: ChoicePanelProps) {
  return (
    <div className="choice-panel">
      <p className="choice-hint">
        {disabled ? 'Choice locked. Waiting for others…' : 'Tap a decision to lock it in.'}
      </p>
      <div className="choice-grid choice-grid-two">
        <button
          type="button"
          className="choice-btn"
          disabled={disabled}
          onClick={() => onSubmit('a')}
        >
          <span className="choice-label">A</span>
          <span className="choice-detail">{card.optionA.label}</span>
        </button>
        <button
          type="button"
          className="choice-btn"
          disabled={disabled}
          onClick={() => onSubmit('b')}
        >
          <span className="choice-label">B</span>
          <span className="choice-detail">{card.optionB.label}</span>
        </button>
      </div>
    </div>
  );
}
