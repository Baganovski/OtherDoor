import type { Choice, Player } from '../types/game';

export function createInitialPlayer(
  id: string,
  name: string,
  joinOrder: number,
): Player {
  return {
    id,
    name,
    connected: true,
    health: 100,
    money: 0,
    hasSubmitted: false,
    joinOrder,
  };
}

export function resolveRound(
  players: Player[],
  choices: Map<string, Choice>,
): Player[] {
  return players.map((player) => {
    if (!player.connected) {
      return { ...player, hasSubmitted: false };
    }

    const choice = choices.get(player.id);
    if (!choice) {
      return { ...player, hasSubmitted: false };
    }

    let { health, money } = player;

    switch (choice) {
      case 'safe':
        health = Math.min(100, health + 5);
        break;
      case 'risk':
        if (Math.random() > 0.5) {
          money += 20;
        } else {
          health = Math.max(0, health - 15);
        }
        break;
      case 'betray':
        money += 30;
        health = Math.max(0, health - 10);
        break;
      default:
        break;
    }

    return {
      ...player,
      health,
      money,
      hasSubmitted: false,
    };
  });
}

export function electHost(players: Player[]): string | null {
  const connected = players
    .filter((player) => player.connected)
    .sort((a, b) => a.joinOrder - b.joinOrder);

  return connected[0]?.id ?? null;
}

export function allConnectedSubmitted(players: Player[]): boolean {
  const active = players.filter((player) => player.connected);
  return active.length > 0 && active.every((player) => player.hasSubmitted);
}
