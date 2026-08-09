import type { DecisionSide, DealtCard, Player, StayBankChoice } from '../types/game';
import { BOT_EXIT_HEALTH_THRESHOLD, STARTING_HEALTH } from '../types/game';
import type { CardEffect } from './cardEffects';
import { getCardById } from './cardEngine';

/** Small noise so identical bots don't always pick the same side. */
const SCORE_NOISE = 0.6;

function mid(min: number, max: number): number {
  return (min + max) / 2;
}

function rollOrMid(
  rolls: Record<string, number>,
  key: string,
  min: number,
  max: number,
): number {
  return rolls[key] ?? mid(min, max);
}

/**
 * Rough expected value for an option, ignoring real opponent splits.
 * Social cards use discounted averages so bots still prefer safer / richer sides.
 */
function estimateEffect(
  effect: CardEffect,
  rolls: Record<string, number>,
): { health: number; money: number } {
  switch (effect.type) {
    case 'takeDamage':
      return { health: -effect.amount, money: 0 };
    case 'receiveGold':
      return { health: 0, money: effect.amount };
    case 'heal':
      return { health: effect.amount, money: 0 };
    case 'healRange':
      return {
        health: rollOrMid(rolls, effect.rollKey, effect.min, effect.max),
        money: 0,
      };
    case 'receiveGoldRange':
      return {
        health: 0,
        money: rollOrMid(rolls, effect.rollKey, effect.min, effect.max),
      };
    case 'damageIfMultiple':
      // Often someone else piles on — treat as partial risk.
      return { health: -effect.multipleDamage * 0.45, money: 0 };
    case 'majorityDamage':
      return { health: -effect.amount * 0.5, money: 0 };
    case 'majorityDamageRange':
      return {
        health: -rollOrMid(rolls, effect.rollKey, effect.min, effect.max) * 0.5,
        money: 0,
      };
    case 'chanceDamage': {
      const chance = rollOrMid(rolls, effect.rollKey, effect.minChance, effect.maxChance);
      return { health: -effect.damage * (chance / 100), money: 0 };
    }
    case 'soloGold': {
      const gold = effect.rollKey
        ? rollOrMid(rolls, effect.rollKey, effect.minGold, effect.maxGold)
        : effect.minGold;
      return { health: 0, money: gold * 0.3 };
    }
    case 'goldThenChanceDamage': {
      const chance = rollOrMid(rolls, effect.rollKey, effect.minChance, effect.maxChance);
      return { health: -effect.damage * (chance / 100), money: effect.gold };
    }
    case 'crowdGold':
      return { health: 0, money: effect.crowdGold * 0.55 };
    case 'parityGold':
      return { health: 0, money: mid(effect.odd, effect.even) };
    case 'parityGoldRange':
      return {
        health: 0,
        money: rollOrMid(rolls, effect.rollKey, effect.min, effect.max) * 0.5,
      };
    case 'parityDamage':
      return { health: -mid(effect.odd, effect.even), money: 0 };
    case 'majorityGold':
      return { health: 0, money: effect.amount * 0.5 };
    case 'majorityGoldRange':
      return {
        health: 0,
        money: rollOrMid(rolls, effect.rollKey, effect.min, effect.max) * 0.5,
      };
    case 'minorityGold':
      return { health: 0, money: effect.amount * 0.4 };
    case 'minorityGoldRange':
      return {
        health: 0,
        money: rollOrMid(rolls, effect.rollKey, effect.min, effect.max) * 0.4,
      };
    case 'everyoneGold':
      return { health: 0, money: effect.amount * 0.35 };
    case 'betrayal':
      // Tempting solo payout vs likely crowd damage.
      return {
        health: -effect.crowdDamage * 0.45,
        money: effect.soloGold * 0.25,
      };
    case 'doubleOrNothing':
      return {
        health: -effect.loseDamage * 0.5,
        money: effect.winGold * 0.5,
      };
    case 'composite':
      return effect.effects.reduce(
        (acc, sub) => {
          const part = estimateEffect(sub, rolls);
          return { health: acc.health + part.health, money: acc.money + part.money };
        },
        { health: 0, money: 0 },
      );
    default:
      return { health: 0, money: 0 };
  }
}

function scoreOption(
  effect: CardEffect,
  player: Player,
  rolls: Record<string, number>,
): number {
  const { health, money } = estimateEffect(effect, rolls);
  // Value survival more when hurt; gold less when death is close.
  const healthWeight = player.health <= 3 ? 4 : player.health <= 5 ? 2.8 : 1.6;
  const goldWeight = player.health <= 3 ? 0.45 : 1;
  // Soft-cap healing past full health.
  const healRoom = STARTING_HEALTH - player.health;
  const effectiveHealth = health > 0 ? Math.min(health, healRoom + 0.25) : health;
  return effectiveHealth * healthWeight + money * goldWeight;
}

export function pickBotChoice(player: Player, card: DealtCard | null): DecisionSide {
  if (!card) {
    return Math.random() < 0.5 ? 'a' : 'b';
  }

  const cardDef = getCardById(card.id);
  if (!cardDef) {
    return Math.random() < 0.5 ? 'a' : 'b';
  }

  const scoreA =
    scoreOption(cardDef.optionA.effect, player, card.rolls) + Math.random() * SCORE_NOISE;
  const scoreB =
    scoreOption(cardDef.optionB.effect, player, card.rolls) + Math.random() * SCORE_NOISE;
  return scoreA >= scoreB ? 'a' : 'b';
}

/**
 * Bank near/at the HP threshold, with light jitter so not every CPU banks in lockstep.
 * Extra bank bias when carrying meaningful unbanked gold while hurt.
 */
export function pickBotStayBank(player: Player): StayBankChoice {
  const hp = player.health;
  const threshold = BOT_EXIT_HEALTH_THRESHOLD;
  const goldPressure = player.money >= 3 && hp <= threshold + 1 ? 0.15 : 0;

  if (hp > threshold + 1) {
    return Math.random() < goldPressure ? 'bank' : 'stay';
  }
  if (hp < threshold - 1) {
    return 'bank';
  }

  // hp in [threshold-1, threshold+1]
  let bankChance: number;
  if (hp > threshold) {
    bankChance = 0.22 + goldPressure;
  } else if (hp < threshold) {
    bankChance = 0.78 + goldPressure;
  } else {
    bankChance = 0.55 + goldPressure;
  }

  return Math.random() < Math.min(0.95, bankChance) ? 'bank' : 'stay';
}

export function isBotPlayer(playerId: string): boolean {
  return playerId.startsWith('bot-');
}
