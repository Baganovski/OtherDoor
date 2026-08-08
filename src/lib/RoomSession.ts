import Peer, { type DataConnection } from 'peerjs';
import type {
  DecisionSide,
  GameState,
  Player,
  PublicGameState,
  RoomCallbacks,
  RoomMessage,
  StayExitChoice,
} from '../types/game';
import { MAX_PLAYERS, MIN_PLAYERS } from '../types/game';
import {
  allActiveSubmitted,
  dealCard,
  hasAlivePlayers,
  isRunFinished,
  resolveCardRound,
  resolveStayExit,
  shouldOfferStayExit,
} from './cardEngine';
import {
  createInitialPlayer,
  electHost,
  markDisconnectedInGame,
  resetPlayersForGameStart,
} from './gameLogic';
function toPublicState(state: GameState): PublicGameState {
  const { localPlayerId: _, ...publicState } = state;
  return publicState;
}
function withLocalId(state: PublicGameState, localPlayerId: string): GameState {
  return { ...state, localPlayerId };
}
function isInGamePhase(phase: GameState['phase']): boolean {
  return phase !== 'lobby' && phase !== 'finished';
}
export class RoomSession {
  private peer: Peer | null = null;
  private connections = new Map<string, DataConnection>();
  private state: GameState;
  private isHost = false;
  private pendingDecisions = new Map<string, DecisionSide>();
  private pendingStayExit = new Map<string, StayExitChoice>();
  private callbacks: RoomCallbacks;
  private hostConnection: DataConnection | null = null;
  private destroyed = false;
  private migrationInProgress = false;
  private constructor(state: GameState, callbacks: RoomCallbacks) {
    this.state = state;
    this.callbacks = callbacks;
  }
  static async create(
    roomCode: string,
    playerName: string,
    playerId: string,
    callbacks: RoomCallbacks,
  ): Promise<RoomSession> {
    const session = new RoomSession(
      {
        roomCode,
        phase: 'lobby',
        round: 0,
        blockNumber: 0,
        choiceIndexInBlock: 0,
        currentCard: null,
        players: [createInitialPlayer(playerId, playerName, 0)],
        hostPlayerId: playerId,
        localPlayerId: playerId,
      },
      callbacks,
    );
    await session.initHostPeer(roomCode);
    session.isHost = true;
    session.emitState();
    return session;
  }
  static async join(
    roomCode: string,
    playerName: string,
    playerId: string,
    callbacks: RoomCallbacks,
  ): Promise<RoomSession> {
    const session = new RoomSession(
      {
        roomCode,
        phase: 'lobby',
        round: 0,
        blockNumber: 0,
        choiceIndexInBlock: 0,
        currentCard: null,
        players: [],
        hostPlayerId: '',
        localPlayerId: playerId,
      },
      callbacks,
    );
    await session.initJoinerPeer(roomCode, playerName, playerId);
    return session;
  }
  getState(): GameState {
    return this.state;
  }
  startGame(): void {
    this.send({ type: 'start', startedBy: this.state.localPlayerId });
    if (this.isHost) {
      this.handleStart(this.state.localPlayerId);
    }
  }
  submitChoice(choice: DecisionSide): void {
    this.send({
      type: 'submitChoice',
      playerId: this.state.localPlayerId,
      choice,
    });
    if (this.isHost) {
      this.handleSubmitChoice(this.state.localPlayerId, choice);
    }
  }
  submitStayExit(choice: StayExitChoice): void {
    this.send({
      type: 'submitStayExit',
      playerId: this.state.localPlayerId,
      choice,
    });
    if (this.isHost) {
      this.handleSubmitStayExit(this.state.localPlayerId, choice);
    }
  }
  destroy(): void {
    this.destroyed = true;
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
    this.hostConnection = null;
    this.peer?.destroy();
    this.peer = null;
  }
  private emitState(): void {
    this.callbacks.onStateChange({ ...this.state, players: [...this.state.players] });
  }
  private emitNotice(message: string): void {
    this.callbacks.onNotice(message);
  }
  private emitError(message: string): void {
    this.callbacks.onError(message);
  }
  private updateState(partial: Partial<GameState>): void {
    this.state = { ...this.state, ...partial };
    this.emitState();
  }
  private send(message: RoomMessage, target?: DataConnection): void {
    const payload = JSON.stringify(message);
    if (target) {
      if (target.open) target.send(payload);
      return;
    }
    if (this.isHost) {
      this.broadcast(message);
      return;
    }
    const hostConnection = this.getHostConnection();
    if (hostConnection?.open) {
      hostConnection.send(payload);
    }
  }
  private broadcast(message: RoomMessage, exceptPlayerId?: string): void {
    const payload = JSON.stringify(message);
    for (const [playerId, connection] of this.connections) {
      if (playerId === exceptPlayerId) continue;
      if (connection.open) connection.send(payload);
    }
  }
  private getHostConnection(): DataConnection | undefined {
    if (this.isHost) return undefined;
    return this.hostConnection ?? undefined;
  }
  private async initHostPeer(roomCode: string): Promise<void> {
    const peer = await this.createPeer(roomCode);
    this.peer = peer;
    peer.on('connection', (connection) => {
      this.registerConnection(connection);
    });
    peer.on('error', (error) => {
      if (!this.destroyed) {
        this.emitError(error.message);
      }
    });
  }
  private async initJoinerPeer(
    roomCode: string,
    playerName: string,
    playerId: string,
  ): Promise<void> {
    const peer = await this.createPeer();
    this.peer = peer;
    peer.on('error', (error) => {
      if (!this.destroyed && !this.migrationInProgress) {
        this.emitError(error.message);
      }
    });
    const connection = peer.connect(roomCode, { reliable: true });
    this.hostConnection = connection;
    this.registerConnection(connection);
    await this.waitForOpen(connection);
    this.send({ type: 'join', name: playerName, playerId }, connection);
  }
  private createPeer(id?: string): Promise<Peer> {
    return new Promise((resolve, reject) => {
      const peer = id ? new Peer(id) : new Peer();
      const onOpen = () => {
        peer.off('error', onError);
        resolve(peer);
      };
      const onError = (error: Error) => {
        peer.off('open', onOpen);
        reject(error);
      };
      peer.once('open', onOpen);
      peer.once('error', onError);
    });
  }
  private waitForOpen(connection: DataConnection): Promise<void> {
    if (connection.open) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const onOpen = () => {
        connection.off('error', onError);
        resolve();
      };
      const onError = (error: Error) => {
        connection.off('open', onOpen);
        reject(error);
      };
      connection.once('open', onOpen);
      connection.once('error', onError);
    });
  }
  private registerConnection(connection: DataConnection, playerIdHint?: string): void {
    const playerId = playerIdHint ?? '';
    connection.on('data', (raw) => {
      try {
        const message = JSON.parse(String(raw)) as RoomMessage;
        this.handleMessage(message, connection);
      } catch {
        this.emitError('Received invalid message from peer.');
      }
    });
    connection.on('close', () => {
      if (playerId) {
        this.connections.delete(playerId);
      }
      this.handleConnectionClosed(connection, playerId);
    });
    connection.on('error', () => {
      if (playerId) {
        this.connections.delete(playerId);
      }
    });
    if (playerId) {
      this.connections.set(playerId, connection);
    }
  }
  private handleMessage(message: RoomMessage, connection: DataConnection): void {
    switch (message.type) {
      case 'join':
        if (this.isHost) this.handleJoin(message, connection);
        break;
      case 'start':
        if (this.isHost) this.handleStart(message.startedBy);
        break;
      case 'submitChoice':
        if (this.isHost) this.handleSubmitChoice(message.playerId, message.choice);
        break;
      case 'submitStayExit':
        if (this.isHost) this.handleSubmitStayExit(message.playerId, message.choice);
        break;
      case 'requestState':
        if (this.isHost) {
          this.mapConnectionToPlayer(connection, message.playerId);
          this.send({ type: 'stateSync', state: toPublicState(this.state) }, connection);
        }
        break;
      case 'joinAck':
        this.state = withLocalId(message.state, message.playerId);
        this.emitState();
        break;
      case 'lobbyUpdate':
        this.updateState({ players: message.players });
        break;
      case 'stateSync':
      case 'roundResult':
        this.state = withLocalId(message.state, this.state.localPlayerId);
        this.emitState();
        break;
      case 'playerLeft':
        this.updateState({ players: message.players });
        this.emitNotice('A player left the game.');
        break;
      case 'hostHandoff':
        this.handleHostHandoff(message);
        break;
      case 'notice':
        this.emitNotice(message.message);
        break;
      case 'error':
        this.emitError(message.message);
        break;
      default:
        break;
    }
  }
  private handleJoin(
    message: Extract<RoomMessage, { type: 'join' }>,
    connection: DataConnection,
  ): void {
    const { name, playerId } = message;
    const activeCount = this.state.players.filter((player) => player.connected).length;
    const duplicateName = this.state.players.some(
      (player) => player.connected && player.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicateName) {
      this.send({ type: 'error', message: 'That name is already taken.' }, connection);
      connection.close();
      return;
    }
    const disconnectedSeat = this.state.players.find(
      (player) =>
        !player.connected &&
        (player.name.toLowerCase() === name.toLowerCase() || player.id === playerId),
    );
    let nextPlayer: Player;
    if (disconnectedSeat) {
      nextPlayer = {
        ...disconnectedSeat,
        connected: true,
        hasSubmitted: false,
      };
      this.state.players = this.state.players.map((player) =>
        player.id === disconnectedSeat.id ? nextPlayer : player,
      );
    } else {
      if (activeCount >= MAX_PLAYERS) {
        this.send({ type: 'error', message: 'This room is full.' }, connection);
        connection.close();
        return;
      }
      if (this.state.phase !== 'lobby') {
        this.send({ type: 'error', message: 'This game has already started.' }, connection);
        connection.close();
        return;
      }
      nextPlayer = createInitialPlayer(playerId, name, this.state.players.length);
      this.state.players = [...this.state.players, nextPlayer];
    }
    this.connections.set(nextPlayer.id, connection);
    this.send(
      {
        type: 'joinAck',
        playerId: nextPlayer.id,
        state: toPublicState({
          ...this.state,
          localPlayerId: nextPlayer.id,
        }),
      },
      connection,
    );
    this.broadcastLobby();
    this.emitState();
  }
  private broadcastLobby(): void {
    const players = [...this.state.players];
    this.broadcast({ type: 'lobbyUpdate', players });
    this.emitState();
  }
  private handleStart(startedBy: string): void {
    if (!this.isHost) return;
    const connectedCount = this.state.players.filter((player) => player.connected).length;
    if (connectedCount < MIN_PLAYERS) {
      this.broadcast({
        type: 'notice',
        message: `Need at least ${MIN_PLAYERS} players to start (${connectedCount}/${MAX_PLAYERS}).`,
      });
      return;
    }
    if (this.state.phase !== 'lobby') return;
    this.pendingDecisions.clear();
    this.pendingStayExit.clear();
    const card = dealCard();
    this.state = {
      ...this.state,
      phase: 'choosing',
      round: 1,
      blockNumber: 1,
      choiceIndexInBlock: 1,
      currentCard: card,
      players: resetPlayersForGameStart(this.state.players),
    };
    this.broadcast({ type: 'start', startedBy });
    this.broadcast({ type: 'stateSync', state: toPublicState(this.state) });
    this.emitState();
    this.emitNotice('The game begins. Make your choice.');
  }
  private handleSubmitChoice(playerId: string, choice: DecisionSide): void {
    if (!this.isHost || this.state.phase !== 'choosing') return;
    const player = this.state.players.find((entry) => entry.id === playerId);
    if (!player?.connected || player.status !== 'alive' || player.hasSubmitted) return;
    this.pendingDecisions.set(playerId, choice);
    this.state.players = this.state.players.map((entry) =>
      entry.id === playerId ? { ...entry, hasSubmitted: true } : entry,
    );
    this.broadcast({ type: 'stateSync', state: toPublicState(this.state) });
    this.emitState();
    if (allActiveSubmitted(this.state.players)) {
      this.resolveCurrentChoice();
    }
  }
  private handleSubmitStayExit(playerId: string, choice: StayExitChoice): void {
    if (!this.isHost || this.state.phase !== 'stayOrExit') return;
    const player = this.state.players.find((entry) => entry.id === playerId);
    if (!player?.connected || player.status !== 'alive' || player.hasSubmitted) return;
    this.pendingStayExit.set(playerId, choice);
    this.state.players = this.state.players.map((entry) =>
      entry.id === playerId ? { ...entry, hasSubmitted: true } : entry,
    );
    this.broadcast({ type: 'stateSync', state: toPublicState(this.state) });
    this.emitState();
    if (allActiveSubmitted(this.state.players)) {
      this.resolveStayExitCheckpoint();
    }
  }
  private resolveCurrentChoice(): void {
    if (!this.isHost || !this.state.currentCard) return;
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
      this.broadcast({ type: 'roundResult', state: toPublicState(this.state) });
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
      this.broadcast({ type: 'roundResult', state: toPublicState(this.state) });
      this.emitState();
      this.emitNotice('Four choices done. Stay in or bank your gold?');
      this.maybeFinishAfterPlayerChange();
      return;
    }
    const nextCard = dealCard();
    this.state = {
      ...this.state,
      phase: 'choosing',
      round: this.state.round + 1,
      choiceIndexInBlock: nextChoiceIndex,
      currentCard: nextCard,
      players: updatedPlayers,
    };
    this.broadcast({ type: 'roundResult', state: toPublicState(this.state) });
    this.emitState();
    this.emitNotice(`Choice ${this.state.choiceIndexInBlock} of 4.`);
    this.maybeFinishAfterPlayerChange();
  }
  private resolveStayExitCheckpoint(): void {
    if (!this.isHost) return;
    this.updateState({ phase: 'resolving' });
    const updatedPlayers = resolveStayExit(this.state.players, this.pendingStayExit);
    this.pendingStayExit.clear();
    if (isRunFinished(updatedPlayers)) {
      this.state = {
        ...this.state,
        phase: 'finished',
        currentCard: null,
        players: updatedPlayers,
      };
      this.broadcast({ type: 'roundResult', state: toPublicState(this.state) });
      this.emitState();
      this.emitNotice('The run is over. Check your banked gold.');
      return;
    }
    if (!hasAlivePlayers(updatedPlayers)) {
      this.state = {
        ...this.state,
        phase: 'finished',
        currentCard: null,
        players: updatedPlayers,
      };
      this.broadcast({ type: 'roundResult', state: toPublicState(this.state) });
      this.emitState();
      this.emitNotice('The run is over. Check your banked gold.');
      return;
    }
    const nextCard = dealCard();
    this.state = {
      ...this.state,
      phase: 'choosing',
      blockNumber: this.state.blockNumber + 1,
      choiceIndexInBlock: 1,
      currentCard: nextCard,
      players: updatedPlayers,
    };
    this.broadcast({ type: 'roundResult', state: toPublicState(this.state) });
    this.emitState();
    this.emitNotice(`Block ${this.state.blockNumber} begins. Make your choice.`);
  }
  private maybeFinishAfterPlayerChange(): void {
    if (!this.isHost) return;
    if (isRunFinished(this.state.players)) {
      this.state = {
        ...this.state,
        phase: 'finished',
        currentCard: null,
      };
      this.broadcast({ type: 'stateSync', state: toPublicState(this.state) });
      this.emitState();
      this.emitNotice('The run is over. Check your banked gold.');
      return;
    }
    if (this.state.phase === 'choosing' && allActiveSubmitted(this.state.players)) {
      this.resolveCurrentChoice();
      return;
    }
    if (this.state.phase === 'stayOrExit' && allActiveSubmitted(this.state.players)) {
      this.resolveStayExitCheckpoint();
    }
  }
  private handleConnectionClosed(connection: DataConnection, playerId: string): void {
    if (this.destroyed) return;
    const resolvedPlayerId =
      playerId ||
      [...this.connections.entries()].find(([, conn]) => conn === connection)?.[0] ||
      '';
    if (this.isHost) {
      if (!resolvedPlayerId) return;
      this.removePlayer(resolvedPlayerId);
      return;
    }
    if (connection === this.hostConnection) {
      this.hostConnection = null;
      void this.beginHostMigration();
    }
  }
  private removePlayer(playerId: string): void {
    const player = this.state.players.find((entry) => entry.id === playerId);
    if (!player) return;
    this.connections.delete(playerId);
    this.pendingDecisions.delete(playerId);
    this.pendingStayExit.delete(playerId);
    const inGame = isInGamePhase(this.state.phase);
    this.state.players = this.state.players.map((entry) =>
      entry.id === playerId ? markDisconnectedInGame(entry, inGame) : entry,
    );
    this.broadcast({
      type: 'playerLeft',
      playerId,
      players: [...this.state.players],
    });
    this.emitNotice(`${player.name} left. Continuing without them.`);
    this.emitState();
    if (inGame) {
      this.maybeFinishAfterPlayerChange();
    }
    if (playerId === this.state.hostPlayerId) {
      void this.beginHostMigration();
    }
  }
  private async beginHostMigration(): Promise<void> {
    if (this.migrationInProgress || this.destroyed) return;
    this.migrationInProgress = true;
    const remaining = this.state.players.filter((player) => player.connected);
    if (remaining.length === 0) {
      this.emitError('Everyone left the room.');
      this.destroy();
      return;
    }
    const newHostId = electHost(this.state.players);
    if (!newHostId) {
      this.emitError('Could not elect a new host.');
      this.destroy();
      return;
    }
    this.state.players = this.state.players.map((player) =>
      player.id === this.state.hostPlayerId
        ? markDisconnectedInGame(player, isInGamePhase(this.state.phase))
        : player,
    );
    this.state.hostPlayerId = newHostId;
    this.pendingDecisions.clear();
    this.pendingStayExit.clear();
    if (newHostId === this.state.localPlayerId) {
      await this.promoteToHost();
    } else {
      await this.reconnectToHost();
    }
    this.migrationInProgress = false;
    if (this.isHost && isInGamePhase(this.state.phase)) {
      this.maybeFinishAfterPlayerChange();
    }
  }
  private async promoteToHost(): Promise<void> {
    this.emitNotice('You are now hosting. Continuing the game.');
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
    this.hostConnection = null;
    this.peer?.destroy();
    this.isHost = true;
    await this.initHostPeer(this.state.roomCode);
    this.broadcast({
      type: 'hostHandoff',
      newHostPlayerId: this.state.localPlayerId,
      state: toPublicState(this.state),
    });
    this.emitState();
  }
  private mapConnectionToPlayer(connection: DataConnection, playerId: string): void {
    this.connections.set(playerId, connection);
    this.state.players = this.state.players.map((player) =>
      player.id === playerId ? { ...player, connected: true, hasSubmitted: false } : player,
    );
  }
  private async reconnectToHost(): Promise<void> {
    this.emitNotice('Host changed. Reconnecting...');
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
    this.hostConnection = null;
    this.peer?.destroy();
    this.isHost = false;
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      const peer = await this.createPeer();
      this.peer = peer;
      const connection = peer.connect(this.state.roomCode, { reliable: true });
      this.hostConnection = connection;
      this.registerConnection(connection);
      await this.waitForOpen(connection);
      this.send(
        {
          type: 'requestState',
          playerId: this.state.localPlayerId,
        },
        connection,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reconnection failed.';
      this.emitError(message);
    }
  }
  private handleHostHandoff(
    message: Extract<RoomMessage, { type: 'hostHandoff' }>,
  ): void {
    this.state = withLocalId(message.state, this.state.localPlayerId);
    this.state.hostPlayerId = message.newHostPlayerId;
    this.isHost = message.newHostPlayerId === this.state.localPlayerId;
    this.emitNotice('New host connected. Game continues.');
    this.emitState();
  }
}
