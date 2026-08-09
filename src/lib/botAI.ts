import type { DecisionSide, Player, StayExitChoice } from '../types/game';
import { BOT_EXIT_HEALTH_THRESHOLD } from '../types/game';

export function pickBotChoice(): DecisionSide {
  return Math.random() < 0.5 ? 'a' : 'b';
}

export function pickBotStayExit(player: Player): StayExitChoice {
  return player.health > BOT_EXIT_HEALTH_THRESHOLD ? 'stay' : 'exit';
}

export function isBotPlayer(playerId: string): boolean {
  return playerId.startsWith('bot-');
}
