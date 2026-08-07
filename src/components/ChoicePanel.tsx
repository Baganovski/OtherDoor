import type { Choice } from '../types/game';

interface ChoicePanelProps {
  disabled: boolean;
  onSubmit: (choice: Choice) => void;
}

const CHOICES: Array<{ id: Choice; label: string; detail: string }> = [
  { id: 'safe', label: 'Safe', detail: '+5 HP' },
  { id: 'risk', label: 'Risk', detail: 'Gems or damage' },
  { id: 'betray', label: 'Betray', detail: '+30 gems, -10 HP' },
];

export function ChoicePanel({ disabled, onSubmit }: ChoicePanelProps) {
  return (
    <div className="choice-panel">
      <p className="choice-hint">
        {disabled ? 'Choice locked. Waiting for others…' : 'Tap a choice to lock it in.'}
      </p>
      <div className="choice-grid">
        {CHOICES.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className="choice-btn"
            disabled={disabled}
            onClick={() => onSubmit(choice.id)}
          >
            <span className="choice-label">{choice.label}</span>
            <span className="choice-detail">{choice.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
