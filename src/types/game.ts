export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const STARTING_HEALTH = 10;
export const CHOICES_PER_BLOCK = 4;
/** Demo bots stay when above this HP; otherwise they exit at the checkpoint. */
export const BOT_EXIT_HEALTH_THRESHOLD = 5;

export type GamePhase = 'lobby' | 'choosing' | 'resolving' | 'stayOrExit' | 'finished';

export type PlayerStatus = 'alive' | 'dead' | 'exited';

export type DecisionSide = 'a' | 'b';

export type StayExitChoice = 'stay' | 'exit';

export interface Player {
  id: string;
  name: string;
  connected: boolean;
  health: number;
  money: number;
  bankedGold: number;
  status: PlayerStatus;
  hasSubmitted: boolean;
  joinOrder: number;
}

export interface DealtCard {
  id: string;
  title: string;
  optionA: { label: string };
  optionB: { label: string };
  rolls: Record<string, number>;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  round: number;
  blockNumber: number;
  choiceIndexInBlock: number;
  currentCard: DealtCard | null;
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
  | { type: 'submitChoice'; playerId: string; choice: DecisionSide }
  | { type: 'submitStayExit'; playerId: string; choice: StayExitChoice }
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
