import { JoinCodeBar } from './JoinCodeBar';
import { LobbyRoster } from './LobbyRoster';
import { GameHud } from './GameHud';
import { ChoicePanel } from './ChoicePanel';
import { StayExitPanel } from './StayExitPanel';
import { ResultsPanel } from './ResultsPanel';
import { Toast } from './Toast';
import { TypewriterText, TYPE_SPEED, typeDelay } from './TypewriterText';
import type { DealtCard, DecisionSide, GamePhase, StayExitChoice } from '../types/game';
import { CHOICES_PER_BLOCK, MAX_PLAYERS, MIN_PLAYERS } from '../types/game';

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

  const eyebrow =
    phase === 'lobby'
      ? 'Waiting room'
      : phase === 'finished'
        ? 'Run complete'
        : phase === 'stayOrExit'
          ? `Block ${blockNumber} complete`
          : `Block ${blockNumber} · Choice ${choiceIndexInBlock} of ${CHOICES_PER_BLOCK}`;

  const title =
    phase === 'lobby'
      ? 'Gather your party'
      : phase === 'finished'
        ? 'Final standings'
        : phase === 'resolving'
          ? 'Fate unfolds…'
          : phase === 'stayOrExit'
            ? 'Stay or bank?'
            : (currentCard?.title ?? 'Choose in secret');

  const copy =
    phase === 'lobby'
      ? `Share the code. Anyone can start with ${MIN_PLAYERS}–${MAX_PLAYERS} players.`
      : phase === 'finished'
        ? 'Banked gold is safe. Anyone who died lost their unbanked gold.'
        : phase === 'resolving'
          ? 'Resolving every choice across the party.'
          : phase === 'stayOrExit'
            ? 'Exit to bank your gold. Stay and risk it for four more choices.'
            : 'Lock your decision. The choice resolves when everyone still in has decided.';

  const headerLines = [eyebrow, title, copy];
  const pageKey = `${phase}-${currentCard?.id ?? 'none'}-${blockNumber}-${choiceIndexInBlock}`;

  return (
    <div className="room-shell">
      <JoinCodeBar code={roomCode} onLeave={onLeave} />

      <main className="room-main">
        {phase === 'lobby' ? (
          <section className="panel lobby-panel">
            <header className="panel-header">
              <TypewriterText
                as="p"
                className="eyebrow"
                text={eyebrow}
                speed={TYPE_SPEED}
                delay={typeDelay(headerLines, 0, TYPE_SPEED)}
                replayKey={pageKey}
              />
              <TypewriterText
                as="h2"
                text={title}
                speed={TYPE_SPEED}
                delay={typeDelay(headerLines, 1, TYPE_SPEED)}
                replayKey={pageKey}
              />
              <TypewriterText
                as="p"
                className="panel-copy"
                text={copy}
                speed={TYPE_SPEED}
                delay={typeDelay(headerLines, 2, TYPE_SPEED)}
                replayKey={pageKey}
              />
            </header>

            <LobbyRoster players={roster} connectedCount={connectedCount} />

            <button
              type="button"
              className="btn btn-primary"
              disabled={!canStart}
              onClick={onStart}
            >
              {canStart
                ? 'Start the game'
                : `Waiting for players (${connectedCount}/${MAX_PLAYERS} · min ${MIN_PLAYERS})`}
            </button>
          </section>
        ) : phase === 'finished' ? (
          <section className="panel game-panel">
            <header className="panel-header">
              <TypewriterText
                as="p"
                className="eyebrow"
                text={eyebrow}
                speed={TYPE_SPEED}
                delay={typeDelay(headerLines, 0, TYPE_SPEED)}
                replayKey={pageKey}
              />
              <TypewriterText
                as="h2"
                text={title}
                speed={TYPE_SPEED}
                delay={typeDelay(headerLines, 1, TYPE_SPEED)}
                replayKey={pageKey}
              />
              <TypewriterText
                as="p"
                className="panel-copy"
                text={copy}
                speed={TYPE_SPEED}
                delay={typeDelay(headerLines, 2, TYPE_SPEED)}
                replayKey={pageKey}
              />
            </header>

            <ResultsPanel players={players} />
          </section>
        ) : (
          <section className="panel game-panel">
            <header className="panel-header">
              <TypewriterText
                as="p"
                className="eyebrow"
                text={eyebrow}
                speed={TYPE_SPEED}
                delay={typeDelay(headerLines, 0, TYPE_SPEED)}
                replayKey={pageKey}
              />
              <TypewriterText
                as="h2"
                text={title}
                speed={TYPE_SPEED}
                delay={typeDelay(headerLines, 1, TYPE_SPEED)}
                replayKey={pageKey}
              />
              <TypewriterText
                as="p"
                className="panel-copy"
                text={copy}
                speed={TYPE_SPEED}
                delay={typeDelay(headerLines, 2, TYPE_SPEED)}
                replayKey={pageKey}
              />
            </header>

            <GameHud players={players} />

            {phase === 'choosing' && currentCard && localCanAct && (
              <ChoicePanel
                card={currentCard}
                disabled={localHasSubmitted}
                onSubmit={onSubmitChoice}
                typeDelayMs={typeDelay(headerLines, 3, TYPE_SPEED)}
                replayKey={pageKey}
              />
            )}

            {phase === 'stayOrExit' && localCanAct && (
              <StayExitPanel
                disabled={localHasSubmitted}
                onSubmit={onSubmitStayExit}
                typeDelayMs={typeDelay(headerLines, 3, TYPE_SPEED)}
                replayKey={pageKey}
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
