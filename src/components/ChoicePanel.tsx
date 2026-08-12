import { useEffect, useRef, useState } from 'react';
import type { DecisionSide } from '../types/game';
import type { DealtCard } from '../types/game';

interface ChoicePanelProps {
  card: DealtCard;
  disabled: boolean;
  onSubmit: (choice: DecisionSide) => void;
  roundKey?: string | number;
  hasBots?: boolean;
}

export function ChoicePanel({
  card,
  disabled,
  onSubmit,
  roundKey,
  hasBots = false,
}: ChoicePanelProps) {
  const [selected, setSelected] = useState<DecisionSide | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const locked = disabled || selected !== null;
  const waitingFor = hasBots ? 'everyone else' : 'other players';

  useEffect(() => {
    setSelected(null);
    const active = document.activeElement;
    if (active instanceof HTMLElement && panelRef.current?.contains(active)) {
      active.blur();
    }
  }, [roundKey, card.id]);

  const handleSelect = (choice: DecisionSide) => {
    if (locked) return;
    setSelected(choice);
    onSubmit(choice);
  };

  const hint = locked
    ? selected
      ? `Selection made: ${selected.toUpperCase()}. Waiting for ${waitingFor}…`
      : `Selection made. Waiting for ${waitingFor}…`
    : 'Tap a decision to lock it in.';

  return (
    <div ref={panelRef} className={`choice-panel${locked ? ' choice-panel-locked' : ''}`}>
      <p className="choice-hint">{hint}</p>
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
          <span className="choice-detail">{card.optionA.label}</span>
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
          <span className="choice-detail">{card.optionB.label}</span>
        </button>
      </div>
    </div>
  );
}
