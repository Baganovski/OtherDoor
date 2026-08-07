import { JoinCodeBar } from './JoinCodeBar';
import { LobbyRoster } from './LobbyRoster';
import { GameHud } from './GameHud';
import { ChoicePanel } from './ChoicePanel';
import { Toast } from './Toast';

interface RoomShellProps {
  roomCode: string;
  phase: 'lobby' | 'playing' | 'resolving';
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
    hasSubmitted: boolean;
    isYou: boolean;
  }>;
  round: number;
  localHasSubmitted: boolean;
  onSubmitChoice: (choice: 'risk' | 'safe' | 'betray') => void;
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
  round,
  localHasSubmitted,
  onSubmitChoice,
  notice,
  error,
  onDismissNotice,
  onDismissError,
}: RoomShellProps) {
  const inGame = phase === 'playing' || phase === 'resolving';

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
              {canStart ? 'Open the door' : `Waiting (${connectedCount}/6)`}
            </button>
          </section>
        ) : (
          <section className="panel game-panel">
            <header className="panel-header">
              <p className="eyebrow">Round {round}</p>
              <h2>{phase === 'resolving' ? 'Fate unfolds…' : 'Choose in secret'}</h2>
              <p className="panel-copy">
                {phase === 'resolving'
                  ? 'Resolving every choice across connected players.'
                  : 'Lock your choice. The round resolves when everyone still in has decided.'}
              </p>
            </header>

            <GameHud players={players} />

            {phase === 'playing' && (
              <ChoicePanel
                disabled={localHasSubmitted}
                onSubmit={onSubmitChoice}
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
