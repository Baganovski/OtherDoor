import { useCallback, useEffect, useRef, useState } from 'react';
import { JoinCodeBar } from './JoinCodeBar';
import { LobbyRoster } from './LobbyRoster';
import { GameHud } from './GameHud';
import { ChoicePanel } from './ChoicePanel';
import { StayExitPanel } from './StayExitPanel';
import { ResultsPanel } from './ResultsPanel';
import { Toast } from './Toast';
import { TypewriterText } from './TypewriterText';
import type { DealtCard, DecisionSide, GamePhase, StayExitChoice } from '../types/game';
import { CHOICES_PER_BLOCK, MAX_PLAYERS, MIN_PLAYERS } from '../types/game';

interface RoomShellProps {
  roomCode: string;
  phase: GamePhase;
  connectedCount: number;
  canStart: boolean;
  onStart: () => void;
  onLeave: () => void;
  isDemo?: boolean;
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

function PanelHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <header className="panel-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="panel-copy">{copy}</p>
    </header>
  );
}

export function RoomShell({
  roomCode,
  phase,
  connectedCount,
  canStart,
  onStart,
  onLeave,
  isDemo = false,
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
  const [optionsReady, setOptionsReady] = useState(true);
  const prevPhaseRef = useRef(phase);

  const eyebrow =
    phase === 'lobby'
      ? isDemo
        ? 'Demo lobby'
        : 'Waiting room'
      : phase === 'finished'
        ? 'Run complete'
        : phase === 'stayOrExit'
          ? `Block ${blockNumber} complete`
          : `Block ${blockNumber} · Choice ${choiceIndexInBlock} of ${CHOICES_PER_BLOCK}`;

  const title =
    phase === 'lobby'
      ? isDemo
        ? 'Practice vs computer'
        : 'Gather your party'
      : phase === 'finished'
        ? 'Final standings'
        : phase === 'resolving'
          ? 'Fate unfolds…'
          : phase === 'stayOrExit'
            ? 'Stay or bank?'
            : (currentCard?.title ?? 'Choose in secret');

  const copy =
    phase === 'lobby'
      ? isDemo
        ? 'CPU opponents pick at random and exit when at or below 5 health.'
        : `Share the code. Anyone can start with ${MIN_PLAYERS}–${MAX_PLAYERS} players.`
      : phase === 'finished'
        ? 'Banked gold is safe. Anyone who died lost their unbanked gold.'
        : phase === 'resolving'
          ? 'Resolving every choice across the party.'
          : phase === 'stayOrExit'
            ? 'Exit to bank your gold. Stay and risk it for four more choices.'
            : 'Lock your decision. The choice resolves when everyone still in has decided.';

  const roundKey = `${phase}-${currentCard?.id ?? 'none'}-${blockNumber}-${choiceIndexInBlock}`;

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    const enteringFromResolve =
      prevPhase === 'resolving' &&
      (phase === 'choosing' || phase === 'stayOrExit');

    const isFirstChoiceOfRun =
      phase === 'choosing' && blockNumber === 1 && choiceIndexInBlock === 1;

    if (enteringFromResolve && !isFirstChoiceOfRun) {
      setOptionsReady(false);
    } else if (isFirstChoiceOfRun) {
      setOptionsReady(true);
    }
  }, [phase, blockNumber, choiceIndexInBlock]);

  const handleInterstitialComplete = useCallback(() => {
    setOptionsReady(true);
  }, []);

  const showChoosing = phase === 'choosing' && currentCard && localCanAct;
  const showStayExit = phase === 'stayOrExit' && localCanAct;
  const showChoiceArea = showChoosing || showStayExit;
  const showInterstitial = showChoiceArea && !optionsReady;

  return (
    <div className="room-shell">
      <JoinCodeBar code={roomCode} onLeave={onLeave} isDemo={isDemo} />

      <main className="room-main">
        {phase === 'lobby' ? (
          <section className="panel lobby-panel">
            <PanelHeader eyebrow={eyebrow} title={title} copy={copy} />

            <LobbyRoster players={roster} connectedCount={connectedCount} />

            <button
              type="button"
              className="btn btn-primary"
              disabled={!canStart}
              onClick={onStart}
            >
              {canStart
                ? isDemo
                  ? 'Start demo'
                  : 'Start the game'
                : `Waiting for players (${connectedCount}/${MAX_PLAYERS} · min ${MIN_PLAYERS})`}
            </button>
          </section>
        ) : phase === 'finished' ? (
          <section className="panel game-panel">
            <PanelHeader eyebrow={eyebrow} title={title} copy={copy} />
            <ResultsPanel players={players} />
          </section>
        ) : (
          <section className="panel game-panel">
            <PanelHeader eyebrow={eyebrow} title={title} copy={copy} />

            {showInterstitial && (
              <div className="next-selection-banner" aria-live="polite">
                <TypewriterText
                  text="NEXT SELECTION"
                  as="p"
                  className="next-selection-text"
                  replayKey={roundKey}
                  onComplete={handleInterstitialComplete}
                />
              </div>
            )}

            {showChoosing && optionsReady && (
              <ChoicePanel
                card={currentCard}
                disabled={localHasSubmitted}
                onSubmit={onSubmitChoice}
                roundKey={roundKey}
              />
            )}

            {showStayExit && optionsReady && (
              <StayExitPanel
                disabled={localHasSubmitted}
                onSubmit={onSubmitStayExit}
                roundKey={roundKey}
              />
            )}

            <GameHud players={players} />
          </section>
        )}
      </main>

      {notice && <Toast message={notice} tone="info" onDismiss={onDismissNotice} />}
      {error && <Toast message={error} tone="error" onDismiss={onDismissError} />}
      {inGame && !notice && !error && (
        <p className="connection-hint">
          {isDemo
            ? 'Local demo — CPUs pick randomly and exit at 5 health or below.'
            : 'Phones stay linked peer-to-peer. Dropped players are skipped.'}
        </p>
      )}
    </div>
  );
}
