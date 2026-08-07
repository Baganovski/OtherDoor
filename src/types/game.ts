export const MAX_PLAYERS = 6;

export type GamePhase = 'lobby' | 'playing' | 'resolving';

export type Choice = 'risk' | 'safe' | 'betray';

export interface Player {
  id: string;
  name: string;
  connected: boolean;
  health: number;
  money: number;
  hasSubmitted: boolean;
  joinOrder: number;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  round: number;
  players: Player[];
  hostPlayerId: string;
  localPlayerId: string;
}

export type RoomMessage =
  | { type: 'join'; name: string; playerId: string }
  | { type: 'joinAck'; playerId: string; state: PublicGameState }
  | { type: 'lobbyUpdate'; players: Player[] }
  | { type: 'start'; startedBy: string }
  | { type: 'stateSync'; state: PublicGameState }
  | { type: 'submitChoice'; playerId: string; choice: Choice }
  | { type: 'roundResult'; state: PublicGameState }
  | { type: 'playerLeft'; playerId: string; players: Player[] }
  | { type: 'hostHandoff'; newHostPlayerId: string; state: PublicGameState }
  | { type: 'requestState'; playerId: string }
  | { type: 'notice'; message: string }
  | { type: 'error'; message: string };

export type PublicGameState = Omit<GameState, 'localPlayerId'>;

export interface RoomCallbacks {
  onStateChange: (state: GameState) => void;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}
