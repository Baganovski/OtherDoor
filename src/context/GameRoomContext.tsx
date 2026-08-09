import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DemoSession } from '../lib/DemoSession';
import { RoomSession } from '../lib/RoomSession';
import { generateRoomCode, normalizeRoomCode } from '../lib/roomCode';
import { getOrCreatePlayerId } from '../lib/playerId';
import type { DecisionSide, GameState, StayExitChoice } from '../types/game';

type ActiveSession = RoomSession | DemoSession;

interface GameRoomContextValue {
  state: GameState | null;
  notice: string | null;
  error: string | null;
  isConnecting: boolean;
  isDemo: boolean;
  createRoom: (playerName: string) => Promise<void>;
  joinRoom: (roomCode: string, playerName: string) => Promise<void>;
  startDemo: (playerName: string, totalPlayers: number) => void;
  startGame: () => void;
  submitChoice: (choice: DecisionSide) => void;
  submitStayExit: (choice: StayExitChoice) => void;
  leaveRoom: () => void;
  clearNotice: () => void;
  clearError: () => void;
}

const GameRoomContext = createContext<GameRoomContextValue | null>(null);

export function GameRoomProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<ActiveSession | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const leaveRoom = useCallback(() => {
    sessionRef.current?.destroy();
    sessionRef.current = null;
    setState(null);
    setNotice(null);
    setError(null);
    setIsConnecting(false);
    setIsDemo(false);
  }, []);

  const createRoom = useCallback(async (playerName: string) => {
    leaveRoom();
    setIsConnecting(true);
    setError(null);

    const roomCode = generateRoomCode();
    const playerId = getOrCreatePlayerId();

    try {
      const session = await RoomSession.create(roomCode, playerName.trim(), playerId, {
        onStateChange: setState,
        onNotice: setNotice,
        onError: setError,
      });
      sessionRef.current = session;
      setIsDemo(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room.';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [leaveRoom]);

  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    leaveRoom();
    setIsConnecting(true);
    setError(null);

    const normalizedCode = normalizeRoomCode(roomCode);
    const playerId = getOrCreatePlayerId();

    try {
      const session = await RoomSession.join(
        normalizedCode,
        playerName.trim(),
        playerId,
        {
          onStateChange: setState,
          onNotice: setNotice,
          onError: setError,
        },
      );
      sessionRef.current = session;
      setIsDemo(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room.';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [leaveRoom]);

  const startDemo = useCallback((playerName: string, totalPlayers: number) => {
    leaveRoom();
    setError(null);
    const playerId = getOrCreatePlayerId();
    const session = DemoSession.create(playerName, playerId, totalPlayers, {
      onStateChange: setState,
      onNotice: setNotice,
      onError: setError,
    });
    sessionRef.current = session;
    setIsDemo(true);
  }, [leaveRoom]);

  const startGame = useCallback(() => {
    sessionRef.current?.startGame();
  }, []);

  const submitChoice = useCallback((choice: DecisionSide) => {
    sessionRef.current?.submitChoice(choice);
  }, []);

  const submitStayExit = useCallback((choice: StayExitChoice) => {
    sessionRef.current?.submitStayExit(choice);
  }, []);

  const value = useMemo(
    () => ({
      state,
      notice,
      error,
      isConnecting,
      isDemo,
      createRoom,
      joinRoom,
      startDemo,
      startGame,
      submitChoice,
      submitStayExit,
      leaveRoom,
      clearNotice: () => setNotice(null),
      clearError: () => setError(null),
    }),
    [
      state,
      notice,
      error,
      isConnecting,
      isDemo,
      createRoom,
      joinRoom,
      startDemo,
      startGame,
      submitChoice,
      submitStayExit,
      leaveRoom,
    ],
  );

  return (
    <GameRoomContext.Provider value={value}>{children}</GameRoomContext.Provider>
  );
}

export function useGameRoom(): GameRoomContextValue {
  const context = useContext(GameRoomContext);
  if (!context) {
    throw new Error('useGameRoom must be used within GameRoomProvider');
  }
  return context;
}
