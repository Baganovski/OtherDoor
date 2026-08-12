export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const STARTING_HEALTH = 10;
export const CHOICES_PER_BLOCK = 4;
export const ROUNDS_PER_RUN = 3;
/** Bots usually bank near this HP at stay/bank checkpoints (with light jitter). */
export const BOT_EXIT_HEALTH_THRESHOLD = 5;

export type GamePhase = 'lobby' | 'choosing' | 'resolving' | 'stayOrBank' | 'finished';

export type PlayerStatus = 'alive' | 'dead' | 'exited';

export type DecisionSide = 'a' | 'b';

export type StayBankChoice = 'stay' | 'bank';

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
  /** When true, displayed A/B are swapped vs the card definition. */
  sidesFlipped?: boolean;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  /** Internal decision-beat counter (not the 1–3 run round). */
  round: number;
  /** Run round index (1…ROUNDS_PER_RUN during play). */
  roundNumber: number;
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
  | { type: 'addBot' }
  | { type: 'removeBot'; playerId: string }
  | { type: 'stateSync'; state: PublicGameState }
  | { type: 'submitChoice'; playerId: string; choice: DecisionSide }
  | { type: 'submitStayBank'; playerId: string; choice: StayBankChoice }
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
