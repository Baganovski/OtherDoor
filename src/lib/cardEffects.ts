export type CardWeight = 'common' | 'uncommon' | 'rare';

export type CardEffect =
  | { type: 'takeDamage'; amount: number }
  | { type: 'receiveGold'; amount: number }
  | { type: 'heal'; amount: number }
  | { type: 'healRange'; min: number; max: number; rollKey: string }
  | { type: 'receiveGoldRange'; min: number; max: number; rollKey: string }
  | { type: 'damageIfMultiple'; multipleDamage: number }
  | { type: 'majorityDamage'; amount: number }
  | { type: 'majorityDamageRange'; min: number; max: number; rollKey: string }
  | { type: 'chanceDamage'; minChance: number; maxChance: number; damage: number; rollKey: string }
  | { type: 'soloGold'; minGold: number; maxGold: number; rollKey?: string }
  | { type: 'goldThenChanceDamage'; gold: number; minChance: number; maxChance: number; damage: number; rollKey: string }
  | { type: 'crowdGold'; crowdGold: number }
  | { type: 'parityGold'; odd: number; even: number }
  | { type: 'parityGoldRange'; match: 'odd' | 'even'; min: number; max: number; rollKey: string }
  | { type: 'parityDamage'; odd: number; even: number }
  | { type: 'majorityGold'; amount: number }
  | { type: 'majorityGoldRange'; min: number; max: number; rollKey: string }
  | { type: 'minorityGold'; amount: number }
  | { type: 'minorityGoldRange'; min: number; max: number; rollKey: string }
  | { type: 'everyoneGold'; amount: number }
  | { type: 'betrayal'; soloGold: number; crowdDamage: number }
  | { type: 'doubleOrNothing'; winGold: number; loseDamage: number; rollKey: string }
  | { type: 'composite'; effects: CardEffect[] };

export interface CardOption {
  label: string;
  effect: CardEffect;
}

export interface CardDefinition {
  id: string;
  title: string;
  weight: CardWeight;
  /** Minimum alive choosers required to deal this card. Default 2. */
  minPlayers?: number;
  /** Maximum alive choosers allowed to deal this card. Default unlimited. */
  maxPlayers?: number;
  optionA: CardOption;
  optionB: CardOption;
}

export interface EffectContext {
  pickersOnSide: number;
  totalChoosers: number;
  pickersOnOtherSide: number;
  rolls: Record<string, number>;
}

export interface EffectDelta {
  health: number;
  money: number;
}

export function emptyDelta(): EffectDelta {
  return { health: 0, money: 0 };
}

export function mergeDelta(a: EffectDelta, b: EffectDelta): EffectDelta {
  return { health: a.health + b.health, money: a.money + b.money };
}

function rollInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRollValue(rolls: Record<string, number>, key: string, min: number, max: number): number {
  if (rolls[key] !== undefined) return rolls[key];
  return rollInt(min, max);
}

function isMajority(count: number, total: number): boolean {
  return count > total / 2;
}

function isMinority(count: number, total: number, otherCount: number): boolean {
  if (count === 0 || total === 0) return false;
  return count < otherCount;
}

export function collectRollKeys(effect: CardEffect): Array<{ key: string; min: number; max: number }> {
  switch (effect.type) {
    case 'healRange':
      return [{ key: effect.rollKey, min: effect.min, max: effect.max }];
    case 'receiveGoldRange':
      return [{ key: effect.rollKey, min: effect.min, max: effect.max }];
    case 'chanceDamage':
      return [{ key: effect.rollKey, min: effect.minChance, max: effect.maxChance }];
    case 'soloGold':
      return effect.rollKey
        ? [{ key: effect.rollKey, min: effect.minGold, max: effect.maxGold }]
        : [];
    case 'goldThenChanceDamage':
      return [{ key: effect.rollKey, min: effect.minChance, max: effect.maxChance }];
    case 'majorityDamageRange':
      return [{ key: effect.rollKey, min: effect.min, max: effect.max }];
    case 'majorityGoldRange':
      return [{ key: effect.rollKey, min: effect.min, max: effect.max }];
    case 'minorityGoldRange':
      return [{ key: effect.rollKey, min: effect.min, max: effect.max }];
    case 'parityGoldRange':
      return [{ key: effect.rollKey, min: effect.min, max: effect.max }];
    case 'doubleOrNothing':
      return [{ key: effect.rollKey, min: 0, max: 1 }];
    case 'composite':
      return effect.effects.flatMap(collectRollKeys);
    default:
      return [];
  }
}

export function rollCardValues(card: CardDefinition): Record<string, number> {
  const rolls: Record<string, number> = {};
  const keysA = collectRollKeys(card.optionA.effect);
  const keysB = collectRollKeys(card.optionB.effect);

  for (const { key, min, max } of [...keysA, ...keysB]) {
    if (rolls[key] === undefined) {
      rolls[key] = rollInt(min, max);
    }
  }

  return rolls;
}

/** Replace range text (e.g. 10–30% or 3–5) with the rolled outcome for display. */
export function resolveOptionLabel(
  label: string,
  effect: CardEffect,
  rolls: Record<string, number>,
): string {
  let resolved = label;
  for (const { key, min, max } of collectRollKeys(effect)) {
    if (min === max) continue;
    const value = rolls[key];
    if (value === undefined) continue;
    const range = new RegExp(`${min}[–-]${max}(%?)`, 'g');
    resolved = resolved.replace(range, `${value}$1`);
  }
  return resolved;
}

export function applyCardEffect(effect: CardEffect, context: EffectContext): EffectDelta {
  const { pickersOnSide, totalChoosers, pickersOnOtherSide, rolls } = context;

  switch (effect.type) {
    case 'takeDamage':
      return { health: -effect.amount, money: 0 };

    case 'receiveGold':
      return { health: 0, money: effect.amount };

    case 'heal':
      return { health: effect.amount, money: 0 };

    case 'healRange': {
      const amount = getRollValue(rolls, effect.rollKey, effect.min, effect.max);
      return { health: amount, money: 0 };
    }

    case 'receiveGoldRange': {
      const amount = getRollValue(rolls, effect.rollKey, effect.min, effect.max);
      return { health: 0, money: amount };
    }

    case 'damageIfMultiple':
      if (pickersOnSide > 1) {
        return { health: -effect.multipleDamage, money: 0 };
      }
      return emptyDelta();

    case 'majorityDamage':
      if (isMajority(pickersOnSide, totalChoosers)) {
        return { health: -effect.amount, money: 0 };
      }
      return emptyDelta();

    case 'majorityDamageRange':
      if (isMajority(pickersOnSide, totalChoosers)) {
        const amount = getRollValue(rolls, effect.rollKey, effect.min, effect.max);
        return { health: -amount, money: 0 };
      }
      return emptyDelta();

    case 'chanceDamage': {
      const chance = getRollValue(rolls, effect.rollKey, effect.minChance, effect.maxChance);
      if (Math.random() * 100 < chance) {
        return { health: -effect.damage, money: 0 };
      }
      return emptyDelta();
    }

    case 'soloGold':
      if (pickersOnSide === 1) {
        const amount = effect.rollKey
          ? getRollValue(rolls, effect.rollKey, effect.minGold, effect.maxGold)
          : effect.minGold;
        return { health: 0, money: amount };
      }
      return emptyDelta();

    case 'goldThenChanceDamage': {
      const delta: EffectDelta = { health: 0, money: effect.gold };
      const chance = getRollValue(rolls, effect.rollKey, effect.minChance, effect.maxChance);
      if (Math.random() * 100 < chance) {
        delta.health -= effect.damage;
      }
      return delta;
    }

    case 'crowdGold':
      if (pickersOnSide > 1) {
        return { health: 0, money: effect.crowdGold };
      }
      return emptyDelta();

    case 'parityGold': {
      const isOdd = pickersOnSide % 2 === 1;
      return { health: 0, money: isOdd ? effect.odd : effect.even };
    }

    case 'parityGoldRange': {
      const isOdd = pickersOnSide % 2 === 1;
      const matches = effect.match === 'odd' ? isOdd : !isOdd;
      if (!matches) return emptyDelta();
      const amount = getRollValue(rolls, effect.rollKey, effect.min, effect.max);
      return { health: 0, money: amount };
    }

    case 'parityDamage': {
      const isOdd = pickersOnSide % 2 === 1;
      const damage = isOdd ? effect.odd : effect.even;
      return damage > 0 ? { health: -damage, money: 0 } : emptyDelta();
    }

    case 'majorityGold':
      if (isMajority(pickersOnSide, totalChoosers)) {
        return { health: 0, money: effect.amount };
      }
      return emptyDelta();

    case 'majorityGoldRange':
      if (isMajority(pickersOnSide, totalChoosers)) {
        const amount = getRollValue(rolls, effect.rollKey, effect.min, effect.max);
        return { health: 0, money: amount };
      }
      return emptyDelta();

    case 'minorityGold':
      if (isMinority(pickersOnSide, totalChoosers, pickersOnOtherSide)) {
        return { health: 0, money: effect.amount };
      }
      return emptyDelta();

    case 'minorityGoldRange':
      if (isMinority(pickersOnSide, totalChoosers, pickersOnOtherSide)) {
        const amount = getRollValue(rolls, effect.rollKey, effect.min, effect.max);
        return { health: 0, money: amount };
      }
      return emptyDelta();

    case 'everyoneGold':
      if (pickersOnSide === totalChoosers && totalChoosers > 0) {
        return { health: 0, money: effect.amount };
      }
      return emptyDelta();

    case 'betrayal':
      if (pickersOnSide === 1) {
        return { health: 0, money: effect.soloGold };
      }
      if (pickersOnSide > 1) {
        return { health: -effect.crowdDamage, money: 0 };
      }
      return emptyDelta();

    case 'doubleOrNothing': {
      const win = getRollValue(rolls, effect.rollKey, 0, 1) === 1;
      return win
        ? { health: 0, money: effect.winGold }
        : { health: -effect.loseDamage, money: 0 };
    }

    case 'composite':
      return effect.effects.reduce(
        (acc, subEffect) => mergeDelta(acc, applyCardEffect(subEffect, context)),
        emptyDelta(),
      );

    default:
      return emptyDelta();
  }
}
