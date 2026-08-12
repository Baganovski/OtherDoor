import type { Player } from '../types/game';
import { STARTING_HEALTH } from '../types/game';
import { isBotPlayer } from './botAI';

export function createInitialPlayer(
  id: string,
  name: string,
  joinOrder: number,
): Player {
  return {
    id,
    name,
    connected: true,
    health: STARTING_HEALTH,
    money: 0,
    bankedGold: 0,
    status: 'alive',
    hasSubmitted: false,
    joinOrder,
  };
}

export function electHost(players: Player[]): string | null {
  const connected = players
    .filter((player) => player.connected && !isBotPlayer(player.id))
    .sort((a, b) => a.joinOrder - b.joinOrder);

  return connected[0]?.id ?? null;
}

export function resetPlayersForGameStart(players: Player[]): Player[] {
  return players.map((player) => ({
    ...player,
    health: STARTING_HEALTH,
    money: 0,
    bankedGold: 0,
    status: 'alive' as const,
    hasSubmitted: false,
  }));
}

export function markDisconnectedInGame(player: Player, inGame: boolean): Player {
  if (!inGame || player.status !== 'alive') {
    return { ...player, connected: false, hasSubmitted: false };
  }

  return {
    ...player,
    connected: false,
    hasSubmitted: false,
    health: 0,
    money: 0,
    status: 'dead',
  };
}
