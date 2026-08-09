import { CARD_DEFINITIONS } from '../data/cards';
import type { CardDefinition } from './cardEffects';
import { applyCardEffect, resolveOptionLabel, rollCardValues } from './cardEffects';
import type { DealtCard, DecisionSide, Player, StayBankChoice } from '../types/game';
import { CHOICES_PER_BLOCK, ROUNDS_PER_RUN, STARTING_HEALTH } from '../types/game';

const WEIGHT_VALUES = { common: 10, uncommon: 3, rare: 1 } as const;

export function getCardById(id: string): CardDefinition | undefined {
  return CARD_DEFINITIONS.find((card) => card.id === id);
}

export function dealCard(chooserCount: number): DealtCard {
  const pool = CARD_DEFINITIONS.filter(
    (card) => chooserCount >= (card.minPlayers ?? 2),
  );
  const deck = pool.length > 0 ? pool : CARD_DEFINITIONS;

  const totalWeight = deck.reduce((sum, card) => sum + WEIGHT_VALUES[card.weight], 0);
  let roll = Math.random() * totalWeight;

  let selected = deck[0];
  for (const card of deck) {
    roll -= WEIGHT_VALUES[card.weight];
    if (roll <= 0) {
      selected = card;
      break;
    }
  }

  const rolls = rollCardValues(selected);

  return {
    id: selected.id,
    title: selected.title,
    optionA: {
      label: resolveOptionLabel(selected.optionA.label, selected.optionA.effect, rolls),
    },
    optionB: {
      label: resolveOptionLabel(selected.optionB.label, selected.optionB.effect, rolls),
    },
    rolls,
  };
}

export function resolveCardRound(
  players: Player[],
  choices: Map<string, DecisionSide>,
  card: DealtCard,
): Player[] {
  const cardDef = getCardById(card.id);
  if (!cardDef) return players;

  const choosers = players.filter((player) => player.status === 'alive' && player.connected);
  const pickersA = choosers.filter((player) => choices.get(player.id) === 'a');
  const pickersB = choosers.filter((player) => choices.get(player.id) === 'b');
  const totalChoosers = choosers.length;

  let updated = players.map((player) => {
    if (player.status !== 'alive' || !player.connected) {
      return { ...player, hasSubmitted: false };
    }

    const side = choices.get(player.id);
    if (!side) {
      return { ...player, hasSubmitted: false };
    }

    const effect = side === 'a' ? cardDef.optionA.effect : cardDef.optionB.effect;
    const pickersOnSide = side === 'a' ? pickersA.length : pickersB.length;
    const pickersOnOtherSide = side === 'a' ? pickersB.length : pickersA.length;

    const delta = applyCardEffect(effect, {
      pickersOnSide,
      totalChoosers,
      pickersOnOtherSide,
      rolls: card.rolls,
    });

    const health = Math.max(0, Math.min(STARTING_HEALTH, player.health + delta.health));
    const money = Math.max(0, player.money + delta.money);

    return {
      ...player,
      health,
      money,
      hasSubmitted: false,
    };
  });

  return applyDeaths(updated);
}

export function resolveStayBank(
  players: Player[],
  choices: Map<string, StayBankChoice>,
): Player[] {
  return players.map((player) => {
    if (player.status !== 'alive' || !player.connected) {
      return { ...player, hasSubmitted: false };
    }

    const choice = choices.get(player.id);
    if (!choice) {
      return { ...player, hasSubmitted: false };
    }

    if (choice === 'bank') {
      return {
        ...player,
        bankedGold: player.bankedGold + player.money,
        money: 0,
        status: 'exited',
        hasSubmitted: false,
      };
    }

    return { ...player, hasSubmitted: false };
  });
}

export function applyDeaths(players: Player[]): Player[] {
  return players.map((player) => {
    if (player.status === 'alive' && player.health <= 0) {
      return {
        ...player,
        health: 0,
        money: 0,
        status: 'dead',
        hasSubmitted: false,
      };
    }
    return player;
  });
}

export function getActiveChoosers(players: Player[]): Player[] {
  return players.filter((player) => player.status === 'alive' && player.connected);
}

export function allActiveSubmitted(players: Player[]): boolean {
  const active = getActiveChoosers(players);
  return active.length > 0 && active.every((player) => player.hasSubmitted);
}

export function hasAlivePlayers(players: Player[]): boolean {
  return players.some((player) => player.status === 'alive' && player.connected);
}

/** Round over when nobody connected is still playing this round. */
export function isRoundOver(players: Player[]): boolean {
  const connected = players.filter((player) => player.connected);
  if (connected.length === 0) return true;
  return !connected.some((player) => player.status === 'alive');
}

export function hasNonDeadPlayers(players: Player[]): boolean {
  return players.some((player) => player.connected && player.status !== 'dead');
}

export function shouldStartNextRound(roundNumber: number, players: Player[]): boolean {
  return roundNumber < ROUNDS_PER_RUN && hasNonDeadPlayers(players);
}

/** Revive banked (exited) players for the next round; dead stay out for the run. */
export function prepareNextRound(players: Player[]): Player[] {
  return players.map((player) => {
    if (!player.connected || player.status === 'dead') {
      return { ...player, hasSubmitted: false };
    }

    return {
      ...player,
      status: 'alive',
      health: STARTING_HEALTH,
      money: 0,
      hasSubmitted: false,
    };
  });
}

export function shouldOfferStayBank(choiceIndexInBlock: number): boolean {
  return choiceIndexInBlock >= CHOICES_PER_BLOCK;
}
