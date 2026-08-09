import { useEffect, useRef, useState } from 'react';
import type { StayBankChoice } from '../types/game';

interface StayExitPanelProps {
  disabled: boolean;
  onSubmit: (choice: StayBankChoice) => void;
  roundKey?: string | number;
  isDemo?: boolean;
}

const STAY_DETAIL = 'Keep playing this round with your unbanked gold at risk';
const BANK_DETAIL = 'Bank your gold and sit out the rest of this round';

export function StayExitPanel({
  disabled,
  onSubmit,
  roundKey,
  isDemo = false,
}: StayExitPanelProps) {
  const [selected, setSelected] = useState<StayBankChoice | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const locked = disabled || selected !== null;
  const waitingFor = isDemo ? 'CPUs' : 'other players';

  useEffect(() => {
    setSelected(null);
    const active = document.activeElement;
    if (active instanceof HTMLElement && panelRef.current?.contains(active)) {
      active.blur();
    }
  }, [roundKey]);

  const handleSelect = (choice: StayBankChoice) => {
    if (locked) return;
    setSelected(choice);
    onSubmit(choice);
  };

  const hint = locked
    ? selected
      ? `Selection made: ${selected === 'stay' ? 'Stay' : 'Bank'}. Waiting for ${waitingFor}…`
      : `Selection made. Waiting for ${waitingFor}…`
    : 'Bank to sit out this round, or stay for another four choices.';

  return (
    <div ref={panelRef} className={`choice-panel${locked ? ' choice-panel-locked' : ''}`}>
      <p className="choice-hint">{hint}</p>
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
          <span className="choice-detail">{STAY_DETAIL}</span>
        </button>
        <button
          type="button"
          className={`choice-btn choice-btn-exit${selected === 'bank' ? ' choice-btn-selected' : ''}${locked && selected !== 'bank' ? ' choice-btn-dimmed' : ''}`}
          disabled={locked}
          onClick={() => handleSelect('bank')}
        >
          <span className="choice-label">
            Bank
            {selected === 'bank' && <span className="choice-selected-tag">Selected</span>}
          </span>
          <span className="choice-detail">{BANK_DETAIL}</span>
        </button>
      </div>
    </div>
  );
}
