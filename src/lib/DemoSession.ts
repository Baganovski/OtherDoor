import type {
  DecisionSide,
  GameState,
  Player,
  RoomCallbacks,
  StayBankChoice,
} from '../types/game';
import { MAX_PLAYERS, MIN_PLAYERS, ROUNDS_PER_RUN } from '../types/game';
import {
  allActiveSubmitted,
  dealCard,
  getActiveChoosers,
  hasAlivePlayers,
  isRoundOver,
  prepareNextRound,
  resolveCardRound,
  resolveStayBank,
  shouldOfferStayBank,
  shouldStartNextRound,
} from './cardEngine';
import { createInitialPlayer, resetPlayersForGameStart } from './gameLogic';
import { isBotPlayer, pickBotChoice, pickBotStayBank } from './botAI';

const DEMO_ROOM_CODE = 'DEMO';
const BOT_THINK_MIN_MS = 1000;
const BOT_THINK_MAX_MS = 5000;
const RESOLVE_DWELL_MS = 900;

function randomBotThinkMs(): number {
  return (
    BOT_THINK_MIN_MS +
    Math.floor(Math.random() * (BOT_THINK_MAX_MS - BOT_THINK_MIN_MS + 1))
  );
}

export class DemoSession {
  private state: GameState;
  private pendingDecisions = new Map<string, DecisionSide>();
  private pendingStayBank = new Map<string, StayBankChoice>();
  private callbacks: RoomCallbacks;
  private destroyed = false;
  private botTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private resolveTimer: ReturnType<typeof setTimeout> | null = null;

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
        roundNumber: 0,
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

    this.clearAllTimers();
    this.pendingDecisions.clear();
    this.pendingStayBank.clear();
    const card = dealCard(getActiveChoosers(this.state.players).length);
    this.state = {
      ...this.state,
      phase: 'choosing',
      round: 1,
      roundNumber: 1,
      blockNumber: 1,
      choiceIndexInBlock: 1,
      currentCard: card,
      players: resetPlayersForGameStart(this.state.players),
    };
    this.emitState();
    this.emitNotice(`Round 1 of ${ROUNDS_PER_RUN} begins. Make your choice.`);
    this.scheduleBotTurns();
  }

  submitChoice(choice: DecisionSide): void {
    if (this.destroyed) return;
    this.applyChoice(this.state.localPlayerId, choice);
  }

  submitStayBank(choice: StayBankChoice): void {
    if (this.destroyed) return;
    this.applyStayBank(this.state.localPlayerId, choice);
  }

  destroy(): void {
    this.destroyed = true;
    this.clearAllTimers();
  }

  private emitState(): void {
    this.callbacks.onStateChange({ ...this.state, players: [...this.state.players] });
  }

  private emitNotice(message: string): void {
    this.callbacks.onNotice(message);
  }

  private clearBotTimers(): void {
    for (const timer of this.botTimers.values()) {
      clearTimeout(timer);
    }
    this.botTimers.clear();
  }

  private clearResolveTimer(): void {
    if (this.resolveTimer !== null) {
      clearTimeout(this.resolveTimer);
      this.resolveTimer = null;
    }
  }

  private clearAllTimers(): void {
    this.clearBotTimers();
    this.clearResolveTimer();
  }

  private scheduleBotTurns(): void {
    if (this.destroyed) return;
    if (this.state.phase !== 'choosing' && this.state.phase !== 'stayOrBank') return;

    const phase = this.state.phase;
    for (const player of this.state.players) {
      if (
        !isBotPlayer(player.id) ||
        !player.connected ||
        player.status !== 'alive' ||
        player.hasSubmitted ||
        this.botTimers.has(player.id)
      ) {
        continue;
      }

      const botId = player.id;
      const timer = setTimeout(() => {
        this.botTimers.delete(botId);
        if (this.destroyed) return;
        this.runSingleBotTurn(botId, phase);
      }, randomBotThinkMs());
      this.botTimers.set(botId, timer);
    }
  }

  private runSingleBotTurn(
    botId: string,
    scheduledPhase: 'choosing' | 'stayOrBank',
  ): void {
    if (this.state.phase !== scheduledPhase) return;

    const bot = this.state.players.find((entry) => entry.id === botId);
    if (
      !bot ||
      !isBotPlayer(bot.id) ||
      !bot.connected ||
      bot.status !== 'alive' ||
      bot.hasSubmitted
    ) {
      return;
    }

    if (scheduledPhase === 'choosing') {
      this.applyChoice(botId, pickBotChoice(bot, this.state.currentCard));
      return;
    }

    this.applyStayBank(botId, pickBotStayBank(bot));
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
    }
  }

  private applyStayBank(playerId: string, choice: StayBankChoice): void {
    if (this.state.phase !== 'stayOrBank') return;
    const player = this.state.players.find((entry) => entry.id === playerId);
    if (!player?.connected || player.status !== 'alive' || player.hasSubmitted) return;

    this.pendingStayBank.set(playerId, choice);
    this.state.players = this.state.players.map((entry) =>
      entry.id === playerId ? { ...entry, hasSubmitted: true } : entry,
    );
    this.emitState();

    if (allActiveSubmitted(this.state.players)) {
      this.resolveStayBankCheckpoint();
    }
  }

  private resolveCurrentChoice(): void {
    if (!this.state.currentCard) return;
    this.clearBotTimers();

    const card = this.state.currentCard;
    const decisions = new Map(this.pendingDecisions);
    this.pendingDecisions.clear();

    const updatedPlayers = resolveCardRound(this.state.players, decisions, card);
    // Apply outcomes now so HP/gold can step during the resolve beat;
    // keep Decision made visible until the next phase.
    this.state = {
      ...this.state,
      phase: 'resolving',
      players: updatedPlayers.map((player) =>
        player.status === 'alive' && player.connected
          ? { ...player, hasSubmitted: true }
          : player,
      ),
    };
    this.emitState();

    this.clearResolveTimer();
    this.resolveTimer = setTimeout(() => {
      this.resolveTimer = null;
      if (this.destroyed) return;
      this.finishCardRound(updatedPlayers);
    }, RESOLVE_DWELL_MS);
  }

  private finishCardRound(updatedPlayers: Player[]): void {
    if (!hasAlivePlayers(updatedPlayers)) {
      this.advanceRoundOrFinish(updatedPlayers);
      return;
    }

    const nextChoiceIndex = this.state.choiceIndexInBlock + 1;
    if (shouldOfferStayBank(this.state.choiceIndexInBlock)) {
      this.state = {
        ...this.state,
        phase: 'stayOrBank',
        round: this.state.round + 1,
        choiceIndexInBlock: nextChoiceIndex,
        currentCard: null,
        players: updatedPlayers.map((player) => ({ ...player, hasSubmitted: false })),
      };
      this.emitState();
      this.emitNotice('Four choices done. Stay in or bank your gold for this round?');
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

  private resolveStayBankCheckpoint(): void {
    this.clearBotTimers();

    const decisions = new Map(this.pendingStayBank);
    this.pendingStayBank.clear();

    const updatedPlayers = resolveStayBank(this.state.players, decisions);
    this.state = {
      ...this.state,
      phase: 'resolving',
      players: updatedPlayers.map((player) =>
        player.status === 'alive' && player.connected
          ? { ...player, hasSubmitted: true }
          : player,
      ),
    };
    this.emitState();

    this.clearResolveTimer();
    this.resolveTimer = setTimeout(() => {
      this.resolveTimer = null;
      if (this.destroyed) return;
      this.finishStayBank(updatedPlayers);
    }, RESOLVE_DWELL_MS);
  }

  private finishStayBank(updatedPlayers: Player[]): void {
    if (hasAlivePlayers(updatedPlayers)) {
      const nextCard = dealCard(getActiveChoosers(updatedPlayers).length);
      this.state = {
        ...this.state,
        phase: 'choosing',
        round: this.state.round + 1,
        blockNumber: this.state.blockNumber + 1,
        choiceIndexInBlock: 1,
        currentCard: nextCard,
        players: updatedPlayers,
      };
      this.emitState();
      this.emitNotice(`Block ${this.state.blockNumber} begins. Make your choice.`);
      this.scheduleBotTurns();
      return;
    }

    this.advanceRoundOrFinish(updatedPlayers);
  }

  private advanceRoundOrFinish(players: Player[]): void {
    if (!isRoundOver(players)) {
      return;
    }

    if (shouldStartNextRound(this.state.roundNumber, players)) {
      const nextRound = this.state.roundNumber + 1;
      const revived = prepareNextRound(players);
      const nextCard = dealCard(getActiveChoosers(revived).length);
      this.state = {
        ...this.state,
        phase: 'choosing',
        round: this.state.round + 1,
        roundNumber: nextRound,
        blockNumber: 1,
        choiceIndexInBlock: 1,
        currentCard: nextCard,
        players: revived,
      };
      this.emitState();
      this.emitNotice(
        `Round ${nextRound} of ${ROUNDS_PER_RUN} — healed. Make your choice.`,
      );
      this.scheduleBotTurns();
      return;
    }

    this.state = {
      ...this.state,
      phase: 'finished',
      currentCard: null,
      players,
    };
    this.emitState();
    this.emitNotice('The run is over. Check your banked gold.');
  }
}
