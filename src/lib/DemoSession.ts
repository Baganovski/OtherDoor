import type {
  DecisionSide,
  GameState,
  RoomCallbacks,
  StayExitChoice,
} from '../types/game';
import { MAX_PLAYERS, MIN_PLAYERS } from '../types/game';
import {
  allActiveSubmitted,
  dealCard,
  getActiveChoosers,
  hasAlivePlayers,
  isRunFinished,
  resolveCardRound,
  resolveStayExit,
  shouldOfferStayExit,
} from './cardEngine';
import { createInitialPlayer, resetPlayersForGameStart } from './gameLogic';
import { isBotPlayer, pickBotChoice, pickBotStayExit } from './botAI';

const DEMO_ROOM_CODE = 'DEMO';
const BOT_THINK_MS = 450;

export class DemoSession {
  private state: GameState;
  private pendingDecisions = new Map<string, DecisionSide>();
  private pendingStayExit = new Map<string, StayExitChoice>();
  private callbacks: RoomCallbacks;
  private destroyed = false;
  private botTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor(state: GameState, callbacks: RoomCallbacks) {
    this.state = state;
    this.callbacks = callbacks;
  }

  static create(
    playerName: string,
    playerId: string,
    totalPlayers: number,
    callbacks: RoomCallbacks,
  ): DemoSession {
    const clampedTotal = Math.max(
      MIN_PLAYERS,
      Math.min(MAX_PLAYERS, Math.floor(totalPlayers)),
    );
    const human = createInitialPlayer(playerId, playerName.trim() || 'You', 0);
    const bots = Array.from({ length: clampedTotal - 1 }, (_, index) =>
      createInitialPlayer(`bot-${index + 1}`, `CPU ${index + 1}`, index + 1),
    );

    const session = new DemoSession(
      {
        roomCode: DEMO_ROOM_CODE,
        phase: 'lobby',
        round: 0,
        blockNumber: 0,
        choiceIndexInBlock: 0,
        currentCard: null,
        players: [human, ...bots],
        hostPlayerId: playerId,
        localPlayerId: playerId,
      },
      callbacks,
    );
    session.emitState();
    session.emitNotice(
      `Demo lobby ready — you vs ${clampedTotal - 1} computer player${clampedTotal - 1 === 1 ? '' : 's'}.`,
    );
    return session;
  }

  getState(): GameState {
    return this.state;
  }

  startGame(): void {
    if (this.destroyed || this.state.phase !== 'lobby') return;

    const connectedCount = this.state.players.filter((player) => player.connected).length;
    if (connectedCount < MIN_PLAYERS) {
      this.emitNotice(
        `Need at least ${MIN_PLAYERS} players to start (${connectedCount}/${MAX_PLAYERS}).`,
      );
      return;
    }

    this.clearBotTimer();
    this.pendingDecisions.clear();
    this.pendingStayExit.clear();
    const card = dealCard(getActiveChoosers(this.state.players).length);
    this.state = {
      ...this.state,
      phase: 'choosing',
      round: 1,
      blockNumber: 1,
      choiceIndexInBlock: 1,
      currentCard: card,
      players: resetPlayersForGameStart(this.state.players),
    };
    this.emitState();
    this.emitNotice('Demo run begins. Make your choice.');
    this.scheduleBotTurns();
  }

  submitChoice(choice: DecisionSide): void {
    if (this.destroyed) return;
    this.applyChoice(this.state.localPlayerId, choice);
  }

  submitStayExit(choice: StayExitChoice): void {
    if (this.destroyed) return;
    this.applyStayExit(this.state.localPlayerId, choice);
  }

  destroy(): void {
    this.destroyed = true;
    this.clearBotTimer();
  }

  private emitState(): void {
    this.callbacks.onStateChange({ ...this.state, players: [...this.state.players] });
  }

  private emitNotice(message: string): void {
    this.callbacks.onNotice(message);
  }

  private updateState(partial: Partial<GameState>): void {
    this.state = { ...this.state, ...partial };
    this.emitState();
  }

  private clearBotTimer(): void {
    if (this.botTimer !== null) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
  }

  private scheduleBotTurns(): void {
    this.clearBotTimer();
    if (this.destroyed) return;
    if (this.state.phase !== 'choosing' && this.state.phase !== 'stayOrExit') return;

    const pendingBots = this.state.players.filter(
      (player) =>
        isBotPlayer(player.id) &&
        player.connected &&
        player.status === 'alive' &&
        !player.hasSubmitted,
    );
    if (pendingBots.length === 0) return;

    this.botTimer = setTimeout(() => {
      this.botTimer = null;
      if (this.destroyed) return;
      this.runBotTurns();
    }, BOT_THINK_MS);
  }

  private runBotTurns(): void {
    if (this.state.phase === 'choosing') {
      for (const bot of this.state.players) {
        if (
          !isBotPlayer(bot.id) ||
          !bot.connected ||
          bot.status !== 'alive' ||
          bot.hasSubmitted
        ) {
          continue;
        }
        this.applyChoice(bot.id, pickBotChoice());
        if (this.state.phase !== 'choosing') return;
      }
      return;
    }

    if (this.state.phase === 'stayOrExit') {
      for (const bot of this.state.players) {
        if (
          !isBotPlayer(bot.id) ||
          !bot.connected ||
          bot.status !== 'alive' ||
          bot.hasSubmitted
        ) {
          continue;
        }
        this.applyStayExit(bot.id, pickBotStayExit(bot));
        if (this.state.phase !== 'stayOrExit') return;
      }
    }
  }

  private applyChoice(playerId: string, choice: DecisionSide): void {
    if (this.state.phase !== 'choosing') return;
    const player = this.state.players.find((entry) => entry.id === playerId);
    if (!player?.connected || player.status !== 'alive' || player.hasSubmitted) return;

    this.pendingDecisions.set(playerId, choice);
    this.state.players = this.state.players.map((entry) =>
      entry.id === playerId ? { ...entry, hasSubmitted: true } : entry,
    );
    this.emitState();

    if (allActiveSubmitted(this.state.players)) {
      this.resolveCurrentChoice();
      return;
    }

    this.scheduleBotTurns();
  }

  private applyStayExit(playerId: string, choice: StayExitChoice): void {
    if (this.state.phase !== 'stayOrExit') return;
    const player = this.state.players.find((entry) => entry.id === playerId);
    if (!player?.connected || player.status !== 'alive' || player.hasSubmitted) return;

    this.pendingStayExit.set(playerId, choice);
    this.state.players = this.state.players.map((entry) =>
      entry.id === playerId ? { ...entry, hasSubmitted: true } : entry,
    );
    this.emitState();

    if (allActiveSubmitted(this.state.players)) {
      this.resolveStayExitCheckpoint();
      return;
    }

    this.scheduleBotTurns();
  }

  private resolveCurrentChoice(): void {
    if (!this.state.currentCard) return;
    this.clearBotTimer();
    this.updateState({ phase: 'resolving' });

    const updatedPlayers = resolveCardRound(
      this.state.players,
      this.pendingDecisions,
      this.state.currentCard,
    );
    this.pendingDecisions.clear();

    if (!hasAlivePlayers(updatedPlayers)) {
      this.state = {
        ...this.state,
        phase: 'finished',
        currentCard: null,
        players: updatedPlayers,
      };
      this.emitState();
      this.emitNotice('The run is over. Check your banked gold.');
      return;
    }

    const nextChoiceIndex = this.state.choiceIndexInBlock + 1;
    if (shouldOfferStayExit(this.state.choiceIndexInBlock)) {
      this.state = {
        ...this.state,
        phase: 'stayOrExit',
        round: this.state.round + 1,
        choiceIndexInBlock: nextChoiceIndex,
        currentCard: null,
        players: updatedPlayers.map((player) => ({ ...player, hasSubmitted: false })),
      };
      this.emitState();
      this.emitNotice('Four choices done. Stay in or bank your gold?');
      this.scheduleBotTurns();
      return;
    }

    const nextCard = dealCard(getActiveChoosers(updatedPlayers).length);
    this.state = {
      ...this.state,
      phase: 'choosing',
      round: this.state.round + 1,
      choiceIndexInBlock: nextChoiceIndex,
      currentCard: nextCard,
      players: updatedPlayers,
    };
    this.emitState();
    this.emitNotice(`Choice ${this.state.choiceIndexInBlock} of 4.`);
    this.scheduleBotTurns();
  }

  private resolveStayExitCheckpoint(): void {
    this.clearBotTimer();
    this.updateState({ phase: 'resolving' });

    const updatedPlayers = resolveStayExit(this.state.players, this.pendingStayExit);
    this.pendingStayExit.clear();

    if (isRunFinished(updatedPlayers) || !hasAlivePlayers(updatedPlayers)) {
      this.state = {
        ...this.state,
        phase: 'finished',
        currentCard: null,
        players: updatedPlayers,
      };
      this.emitState();
      this.emitNotice('The run is over. Check your banked gold.');
      return;
    }

    const nextCard = dealCard(getActiveChoosers(updatedPlayers).length);
    this.state = {
      ...this.state,
      phase: 'choosing',
      blockNumber: this.state.blockNumber + 1,
      choiceIndexInBlock: 1,
      currentCard: nextCard,
      players: updatedPlayers,
    };
    this.emitState();
    this.emitNotice(`Block ${this.state.blockNumber} begins. Make your choice.`);
    this.scheduleBotTurns();
  }
}
