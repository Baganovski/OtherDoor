import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { JoinCodeBar } from './JoinCodeBar';
import { LobbyRoster } from './LobbyRoster';
import { GameHud } from './GameHud';
import { ChoicePanel } from './ChoicePanel';
import { StayExitPanel } from './StayExitPanel';
import { ResultsPanel } from './ResultsPanel';
import { Toast } from './Toast';
import { TypewriterText } from './TypewriterText';
import type { DealtCard, DecisionSide, GamePhase, StayBankChoice } from '../types/game';
import { CHOICES_PER_BLOCK, MAX_PLAYERS, MIN_PLAYERS, ROUNDS_PER_RUN } from '../types/game';

const NEXT_SELECTION_HOLD_MS = 3000;
const ACTION_SLOT_FALLBACK_MIN_PX = 232;

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
  roundNumber: number;
  blockNumber: number;
  choiceIndexInBlock: number;
  currentCard: DealtCard | null;
  localHasSubmitted: boolean;
  localCanAct: boolean;
  onSubmitChoice: (choice: DecisionSide) => void;
  onSubmitStayBank: (choice: StayBankChoice) => void;
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
  roundNumber,
  blockNumber,
  choiceIndexInBlock,
  currentCard,
  localHasSubmitted,
  localCanAct,
  onSubmitChoice,
  onSubmitStayBank,
  notice,
  error,
  onDismissNotice,
  onDismissError,
}: RoomShellProps) {
  const inGame = phase !== 'lobby' && phase !== 'finished';
  const [optionsReady, setOptionsReady] = useState(true);
  const [interstitialStep, setInterstitialStep] = useState(0);
  const [interstitialLines, setInterstitialLines] = useState<string[]>(['NEXT SELECTION']);
  const [actionSlotMinHeight, setActionSlotMinHeight] = useState(ACTION_SLOT_FALLBACK_MIN_PX);
  const prevPhaseRef = useRef(phase);
  const interstitialHoldTimerRef = useRef(0);
  const actionSlotRef = useRef<HTMLDivElement>(null);

  const eyebrow =
    phase === 'lobby'
      ? isDemo
        ? 'Demo lobby'
        : 'Waiting room'
      : phase === 'finished'
        ? 'Run complete'
        : phase === 'stayOrBank'
          ? `Round ${roundNumber} of ${ROUNDS_PER_RUN} · Block ${blockNumber} complete`
          : `Round ${roundNumber} of ${ROUNDS_PER_RUN} · Block ${blockNumber} · Choice ${choiceIndexInBlock} of ${CHOICES_PER_BLOCK}`;

  const title =
    phase === 'lobby'
      ? isDemo
        ? 'Practice vs computer'
        : 'Gather your party'
      : phase === 'finished'
        ? 'Final standings'
        : phase === 'resolving'
          ? 'Fate unfolds…'
          : phase === 'stayOrBank'
            ? 'Stay or bank?'
            : (currentCard?.title ?? 'Choose in secret');

  const copy =
    phase === 'lobby'
      ? isDemo
        ? 'Take your time — CPUs think for a few seconds, weigh risk vs reward, and usually bank near 5 health.'
        : `Share the code. Anyone can start with ${MIN_PLAYERS}–${MAX_PLAYERS} players.`
      : phase === 'finished'
        ? 'Banked gold is safe. Anyone who died lost their unbanked gold and is out for the run.'
        : phase === 'resolving'
          ? 'Resolving every choice across the party.'
          : phase === 'stayOrBank'
            ? 'Bank to sit out this round. Stay and risk pocket gold for four more choices. Survivors heal between rounds.'
            : 'Lock your decision. The choice resolves when everyone still in has decided.';

  // Stable across the resolve beat so locked selection UI isn't cleared mid-hold.
  const choiceKey = `${currentCard?.id ?? 'stay-bank'}-${roundNumber}-${blockNumber}-${choiceIndexInBlock}`;
  const interstitialKey = useMemo(
    () => `${phase}-${choiceKey}-${interstitialStep}-${interstitialLines[interstitialStep] ?? ''}`,
    [phase, choiceKey, interstitialStep, interstitialLines],
  );

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    const enteringFromResolve =
      prevPhase === 'resolving' &&
      (phase === 'choosing' || phase === 'stayOrBank' || phase === 'finished');

    const enteringRunFromLobby = prevPhase === 'lobby' && phase === 'choosing';

    const isFirstChoiceOfRun =
      phase === 'choosing' &&
      roundNumber === 1 &&
      blockNumber === 1 &&
      choiceIndexInBlock === 1;

    const isNewRoundStart =
      phase === 'choosing' &&
      blockNumber === 1 &&
      choiceIndexInBlock === 1 &&
      !isFirstChoiceOfRun;

    if (enteringRunFromLobby && isFirstChoiceOfRun) {
      window.clearTimeout(interstitialHoldTimerRef.current);
      setInterstitialLines([`ROUND ${roundNumber}`]);
      setInterstitialStep(0);
      setOptionsReady(false);
    } else if (enteringFromResolve) {
      window.clearTimeout(interstitialHoldTimerRef.current);
      if (phase === 'finished') {
        setInterstitialLines(['ROUND END']);
      } else if (isNewRoundStart) {
        setInterstitialLines(['ROUND END', `ROUND ${roundNumber}`]);
      } else {
        setInterstitialLines(['NEXT SELECTION']);
      }
      setInterstitialStep(0);
      setOptionsReady(false);
    }
  }, [phase, roundNumber, blockNumber, choiceIndexInBlock]);

  const handleInterstitialComplete = useCallback(() => {
    window.clearTimeout(interstitialHoldTimerRef.current);
    interstitialHoldTimerRef.current = window.setTimeout(() => {
      setInterstitialStep((step) => {
        const next = step + 1;
        if (next < interstitialLines.length) {
          return next;
        }
        setOptionsReady(true);
        return step;
      });
    }, NEXT_SELECTION_HOLD_MS);
  }, [interstitialLines.length]);

  useEffect(() => {
    return () => window.clearTimeout(interstitialHoldTimerRef.current);
  }, []);

  // Keep locked choices on screen through the resolve beat so the HUD doesn't
  // jump up when options disappear, then jump down again for the interstitial.
  const showChoosing =
    Boolean(currentCard) &&
    ((phase === 'choosing' && localCanAct && optionsReady) || phase === 'resolving');
  const showStayBank =
    !currentCard &&
    ((phase === 'stayOrBank' && localCanAct && optionsReady) || phase === 'resolving');
  const showInterstitial =
    !optionsReady &&
    (phase === 'choosing' || phase === 'stayOrBank' || phase === 'finished') &&
    (phase === 'finished' || localCanAct);
  const showActionSlot =
    phase === 'choosing' || phase === 'resolving' || phase === 'stayOrBank';
  const interstitialText = interstitialLines[interstitialStep] ?? 'NEXT SELECTION';

  useLayoutEffect(() => {
    if (!showChoosing && !showStayBank) return;
    const el = actionSlotRef.current;
    if (!el) return;
    const nextHeight = Math.ceil(el.getBoundingClientRect().height);
    if (nextHeight > 0) {
      setActionSlotMinHeight((prev) => Math.max(prev, nextHeight));
    }
  }, [showChoosing, showStayBank, choiceKey, currentCard]);

  useEffect(() => {
    if (phase === 'lobby' || (phase === 'finished' && optionsReady)) {
      setActionSlotMinHeight(ACTION_SLOT_FALLBACK_MIN_PX);
    }
  }, [phase, optionsReady]);

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
            {showInterstitial ? (
              <div className="next-selection-banner" aria-live="polite">
                <TypewriterText
                  text={interstitialText}
                  as="p"
                  className="next-selection-text"
                  replayKey={interstitialKey}
                  onComplete={handleInterstitialComplete}
                />
              </div>
            ) : (
              <>
                <PanelHeader eyebrow={eyebrow} title={title} copy={copy} />
                <ResultsPanel players={players} />
              </>
            )}
          </section>
        ) : (
          <section className="panel game-panel">
            <PanelHeader eyebrow={eyebrow} title={title} copy={copy} />

            {showActionSlot && (
              <div
                ref={actionSlotRef}
                className={`game-action-slot${showInterstitial ? ' game-action-slot-interstitial' : ''}`}
                style={{ minHeight: actionSlotMinHeight }}
              >
                {showInterstitial && (
                  <div className="next-selection-banner" aria-live="polite">
                    <TypewriterText
                      text={interstitialText}
                      as="p"
                      className="next-selection-text"
                      replayKey={interstitialKey}
                      onComplete={handleInterstitialComplete}
                    />
                  </div>
                )}

                {showChoosing && currentCard && (
                  <ChoicePanel
                    card={currentCard}
                    disabled={localHasSubmitted || phase === 'resolving' || !localCanAct}
                    onSubmit={onSubmitChoice}
                    roundKey={choiceKey}
                    isDemo={isDemo}
                  />
                )}

                {showStayBank && (
                  <StayExitPanel
                    disabled={localHasSubmitted || phase === 'resolving' || !localCanAct}
                    onSubmit={onSubmitStayBank}
                    roundKey={choiceKey}
                    isDemo={isDemo}
                  />
                )}
              </div>
            )}

            <GameHud players={players} isDemo={isDemo} />
          </section>
        )}
      </main>

      {notice && <Toast message={notice} tone="info" onDismiss={onDismissNotice} />}
      {error && <Toast message={error} tone="error" onDismiss={onDismissError} />}
      {inGame && !notice && !error && (
        <p className="connection-hint">
          {isDemo
            ? 'Local demo — CPUs weigh risk vs reward and usually bank near 5 health.'
            : 'Phones stay linked peer-to-peer. Dropped players are skipped.'}
        </p>
      )}
    </div>
  );
}
