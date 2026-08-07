import { JoinCodeBar } from './JoinCodeBar';
import { LobbyRoster } from './LobbyRoster';
import { GameHud } from './GameHud';
import { ChoicePanel } from './ChoicePanel';
import { StayExitPanel } from './StayExitPanel';
import { ResultsPanel } from './ResultsPanel';
import { Toast } from './Toast';
import type { DealtCard, DecisionSide, GamePhase, StayExitChoice } from '../types/game';
import { CHOICES_PER_BLOCK } from '../types/game';

interface RoomShellProps {
  roomCode: string;
  phase: GamePhase;
  connectedCount: number;
  canStart: boolean;
  onStart: () => void;
  onLeave: () => void;
  roster: Array<{
    id: string;
    name: string;
    connected: boolean;
    isHost: boolean;
    isYou: boolean;
  }>;
  players: Array<{
    id: string;
    name: string;
    connected: boolean;
    health: number;
    money: number;
    bankedGold: number;
    status: 'alive' | 'dead' | 'exited';
    hasSubmitted: boolean;
    isYou: boolean;
  }>;
  blockNumber: number;
  choiceIndexInBlock: number;
  currentCard: DealtCard | null;
  localHasSubmitted: boolean;
  localCanAct: boolean;
  onSubmitChoice: (choice: DecisionSide) => void;
  onSubmitStayExit: (choice: StayExitChoice) => void;
  notice: string | null;
  error: string | null;
  onDismissNotice: () => void;
  onDismissError: () => void;
}

export function RoomShell({
  roomCode,
  phase,
  connectedCount,
  canStart,
  onStart,
  onLeave,
  roster,
  players,
  blockNumber,
  choiceIndexInBlock,
  currentCard,
  localHasSubmitted,
  localCanAct,
  onSubmitChoice,
  onSubmitStayExit,
  notice,
  error,
  onDismissNotice,
  onDismissError,
}: RoomShellProps) {
  const inGame = phase !== 'lobby' && phase !== 'finished';

  return (
    <div className="room-shell">
      <JoinCodeBar code={roomCode} onLeave={onLeave} />

      <main className="room-main">
        {phase === 'lobby' ? (
          <section className="panel lobby-panel">
            <header className="panel-header">
              <p className="eyebrow">Waiting room</p>
              <h2>Gather your party</h2>
              <p className="panel-copy">
                Share the code. Start unlocks at 6 players — anyone can open the door.
              </p>
            </header>

            <LobbyRoster players={roster} connectedCount={connectedCount} />

            <button
              type="button"
              className="btn btn-primary"
              disabled={!canStart}
              onClick={onStart}
            >
              {canStart
                ? 'Open the door'
                : `Waiting for players (${connectedCount}/6 · min 2)`}
            </button>
          </section>
        ) : phase === 'finished' ? (
          <section className="panel game-panel">
            <header className="panel-header">
              <p className="eyebrow">Run complete</p>
              <h2>Final standings</h2>
              <p className="panel-copy">
                Banked gold is safe. Anyone who died lost their unbanked gold.
              </p>
            </header>

            <ResultsPanel players={players} />
          </section>
        ) : (
          <section className="panel game-panel">
            <header className="panel-header">
              <p className="eyebrow">
                {phase === 'stayOrExit'
                  ? `Block ${blockNumber} complete`
                  : `Block ${blockNumber} · Choice ${choiceIndexInBlock} of ${CHOICES_PER_BLOCK}`}
              </p>
              <h2>
                {phase === 'resolving'
                  ? 'Fate unfolds…'
                  : phase === 'stayOrExit'
                    ? 'Stay or bank?'
                    : currentCard?.title ?? 'Choose in secret'}
              </h2>
              <p className="panel-copy">
                {phase === 'resolving'
                  ? 'Resolving every choice across the party.'
                  : phase === 'stayOrExit'
                    ? 'Exit to bank your gold. Stay and risk it for four more choices.'
                    : 'Lock your decision. The choice resolves when everyone still in has decided.'}
              </p>
            </header>

            <GameHud players={players} />

            {phase === 'choosing' && currentCard && localCanAct && (
              <ChoicePanel
                card={currentCard}
                disabled={localHasSubmitted}
                onSubmit={onSubmitChoice}
              />
            )}

            {phase === 'stayOrExit' && localCanAct && (
              <StayExitPanel
                disabled={localHasSubmitted}
                onSubmit={onSubmitStayExit}
              />
            )}
          </section>
        )}
      </main>

      {notice && <Toast message={notice} tone="info" onDismiss={onDismissNotice} />}
      {error && <Toast message={error} tone="error" onDismiss={onDismissError} />}
      {inGame && !notice && !error && (
        <p className="connection-hint">Phones stay linked peer-to-peer. Dropped players are skipped.</p>
      )}
    </div>
  );
}
