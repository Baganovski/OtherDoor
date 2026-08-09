import type { CardWeight, CardDefinition } from '../lib/cardEffects';

export const CARD_DEFINITIONS: CardDefinition[] = [
  {
    id: 'take-damage',
    title: 'Take damage',
    weight: 'common',
    optionA: { label: 'Take 1 damage', effect: { type: 'takeDamage', amount: 1 } },
    optionB: {
      label: 'Take 3 damage if more than one player picks this',
      effect: { type: 'damageIfMultiple', multipleDamage: 3 },
    },
  },
  {
    id: 'majority-damage',
    title: 'Majority damage',
    weight: 'common',
    optionA: {
      label: 'If the majority picks this, take 1 damage',
      effect: { type: 'majorityDamage', amount: 1 },
    },
    optionB: {
      label: 'If the majority picks this, take 3 damage',
      effect: { type: 'majorityDamage', amount: 3 },
    },
  },
  {
    id: 'chance-damage',
    title: 'Chance damage',
    weight: 'common',
    optionA: {
      label: '10–30% chance to take 3 damage',
      effect: { type: 'chanceDamage', minChance: 10, maxChance: 30, damage: 3, rollKey: 'a.chance' },
    },
    optionB: {
      label: '70–90% chance to take 1 damage',
      effect: { type: 'chanceDamage', minChance: 70, maxChance: 90, damage: 1, rollKey: 'b.chance' },
    },
  },
  {
    id: 'solo-gold',
    title: 'Solo gold',
    weight: 'common',
    optionA: { label: 'Receive 1 gold', effect: { type: 'receiveGold', amount: 1 } },
    optionB: {
      label: 'Receive 3–5 gold if only you pick this',
      effect: { type: 'soloGold', minGold: 3, maxGold: 5, rollKey: 'b.gold' },
    },
  },
  {
    id: 'risk-gold',
    title: 'Risk gold',
    weight: 'common',
    optionA: {
      label: 'Receive 2 gold, then 40–60% chance to take 1 damage',
      effect: {
        type: 'goldThenChanceDamage',
        gold: 2,
        minChance: 40,
        maxChance: 60,
        damage: 1,
        rollKey: 'a.chance',
      },
    },
    optionB: { label: 'Receive 1 gold', effect: { type: 'receiveGold', amount: 1 } },
  },
  {
    id: 'crowd-gold',
    title: 'Crowd gold',
    weight: 'common',
    optionA: { label: 'Receive 1 gold', effect: { type: 'receiveGold', amount: 1 } },
    optionB: {
      label: 'Receive 3 gold if more than one player picks this',
      effect: { type: 'crowdGold', crowdGold: 3 },
    },
  },
  {
    id: 'safe-vs-gamble',
    title: 'Safe vs gamble',
    weight: 'common',
    optionA: {
      label: '5–20% chance to take 4 damage',
      effect: { type: 'chanceDamage', minChance: 5, maxChance: 20, damage: 4, rollKey: 'a.chance' },
    },
    optionB: {
      label: '80–95% chance to take 1 damage',
      effect: { type: 'chanceDamage', minChance: 80, maxChance: 95, damage: 1, rollKey: 'b.chance' },
    },
  },
  {
    id: 'majority-curse',
    title: 'Majority curse',
    weight: 'common',
    optionA: {
      label: 'If the majority picks this, take 1–2 damage',
      effect: { type: 'majorityDamageRange', min: 1, max: 2, rollKey: 'a.damage' },
    },
    optionB: {
      label: 'If the majority picks this, take 3 damage',
      effect: { type: 'majorityDamage', amount: 3 },
    },
  },
  {
    id: 'blood-money',
    title: 'Blood money',
    weight: 'common',
    optionA: {
      label: 'Take 2 damage, receive 3 gold',
      effect: {
        type: 'composite',
        effects: [
          { type: 'takeDamage', amount: 2 },
          { type: 'receiveGold', amount: 3 },
        ],
      },
    },
    optionB: {
      label: '50% chance to take 1 damage',
      effect: { type: 'chanceDamage', minChance: 50, maxChance: 50, damage: 1, rollKey: 'b.chance' },
    },
  },
  {
    id: 'parity-gold',
    title: 'Parity gold',
    weight: 'common',
    optionA: {
      label: 'Receive 1–2 gold if an odd number of players pick this',
      effect: { type: 'parityGoldRange', match: 'odd', min: 1, max: 2, rollKey: 'a.gold' },
    },
    optionB: {
      label: 'Receive 1–2 gold if an even number of players pick this',
      effect: { type: 'parityGoldRange', match: 'even', min: 1, max: 2, rollKey: 'b.gold' },
    },
  },
  {
    id: 'parity-pain',
    title: 'Parity pain',
    weight: 'common',
    optionA: {
      label: 'Take 1 damage if an odd number of players pick this',
      effect: { type: 'parityDamage', odd: 1, even: 0 },
    },
    optionB: {
      label: 'Take 2 damage if an even number of players pick this',
      effect: { type: 'parityDamage', odd: 0, even: 2 },
    },
  },
  {
    id: 'blood-toll',
    title: 'Blood toll',
    weight: 'common',
    minPlayers: 1,
    maxPlayers: 1,
    optionA: {
      label: 'Take 2 damage, receive 3 gold',
      effect: {
        type: 'composite',
        effects: [
          { type: 'takeDamage', amount: 2 },
          { type: 'receiveGold', amount: 3 },
        ],
      },
    },
    optionB: {
      label: 'Take 1 damage, receive 1 gold',
      effect: {
        type: 'composite',
        effects: [
          { type: 'takeDamage', amount: 1 },
          { type: 'receiveGold', amount: 1 },
        ],
      },
    },
  },
  {
    id: 'spike-or-grind',
    title: 'Spike or grind',
    weight: 'common',
    minPlayers: 1,
    maxPlayers: 1,
    optionA: {
      label: '20–35% chance to take 5 damage',
      effect: { type: 'chanceDamage', minChance: 20, maxChance: 35, damage: 5, rollKey: 'a.chance' },
    },
    optionB: {
      label: 'Take 2 damage, receive 2 gold',
      effect: {
        type: 'composite',
        effects: [
          { type: 'takeDamage', amount: 2 },
          { type: 'receiveGold', amount: 2 },
        ],
      },
    },
  },
  {
    id: 'majority-gold',
    title: 'Majority gold',
    weight: 'uncommon',
    optionA: {
      label: 'If the majority picks this, receive 1 gold',
      effect: { type: 'majorityGold', amount: 1 },
    },
    optionB: {
      label: 'If the majority picks this, receive 2–3 gold',
      effect: { type: 'majorityGoldRange', min: 2, max: 3, rollKey: 'b.gold' },
    },
  },
  {
    id: 'minority-reward',
    title: 'Minority reward',
    weight: 'uncommon',
    minPlayers: 3,
    optionA: {
      label: 'If the minority picks this, receive 1 gold',
      effect: { type: 'minorityGold', amount: 1 },
    },
    optionB: {
      label: 'If the minority picks this, receive 2–3 gold',
      effect: { type: 'minorityGoldRange', min: 2, max: 3, rollKey: 'b.gold' },
    },
  },
  {
    id: 'everyone-wins',
    title: 'Everyone wins',
    weight: 'uncommon',
    optionA: {
      label: 'If everyone picks this, receive 2 gold',
      effect: { type: 'everyoneGold', amount: 2 },
    },
    optionB: {
      label: 'If everyone picks this, receive 4 gold',
      effect: { type: 'everyoneGold', amount: 4 },
    },
  },
  {
    id: 'betrayal-bait',
    title: 'Betrayal bait',
    weight: 'uncommon',
    optionA: { label: 'Take 1 damage', effect: { type: 'takeDamage', amount: 1 } },
    optionB: {
      label: 'Receive 2 gold alone or take 2 damage if shared',
      effect: { type: 'betrayal', soloGold: 2, crowdDamage: 2 },
    },
  },
  {
    id: 'double-or-nothing',
    title: 'Triple or trouble',
    weight: 'uncommon',
    optionA: { label: 'Receive 1 gold', effect: { type: 'receiveGold', amount: 1 } },
    optionB: {
      label: '50% chance to receive 3 gold or take 2 damage',
      effect: {
        type: 'doubleOrNothing',
        winGold: 3,
        loseDamage: 2,
        rollKey: 'b.win',
      },
    },
  },
  {
    id: 'lonely-purse',
    title: 'Lonely purse',
    weight: 'uncommon',
    optionA: {
      label: 'Receive 4 gold if only you pick this',
      effect: { type: 'soloGold', minGold: 4, maxGold: 4 },
    },
    optionB: { label: 'Receive 2 gold', effect: { type: 'receiveGold', amount: 2 } },
  },
  {
    id: 'all-in-gold',
    title: 'All-in gold',
    weight: 'uncommon',
    optionA: {
      label: 'If everyone picks this, receive 5 gold',
      effect: { type: 'everyoneGold', amount: 5 },
    },
    optionB: { label: 'Receive 2 gold', effect: { type: 'receiveGold', amount: 2 } },
  },
  {
    id: 'crowd-or-fringe',
    title: 'Crowd or fringe',
    weight: 'uncommon',
    minPlayers: 3,
    optionA: {
      label: 'If the majority picks this, receive 2 gold',
      effect: { type: 'majorityGold', amount: 2 },
    },
    optionB: {
      label: 'If the minority picks this, receive 3 gold',
      effect: { type: 'minorityGold', amount: 3 },
    },
  },
  {
    id: 'greedy-cut',
    title: 'Greedy cut',
    weight: 'uncommon',
    minPlayers: 1,
    maxPlayers: 1,
    optionA: {
      label: 'Receive 3 gold, then 55–75% chance to take 3 damage',
      effect: {
        type: 'goldThenChanceDamage',
        gold: 3,
        minChance: 55,
        maxChance: 75,
        damage: 3,
        rollKey: 'a.chance',
      },
    },
    optionB: {
      label: 'Take 1 damage, receive 1 gold',
      effect: {
        type: 'composite',
        effects: [
          { type: 'takeDamage', amount: 1 },
          { type: 'receiveGold', amount: 1 },
        ],
      },
    },
  },
  {
    id: 'all-in-alone',
    title: 'All in alone',
    weight: 'uncommon',
    minPlayers: 1,
    maxPlayers: 1,
    optionA: {
      label: '50% chance to receive 5 gold or take 4 damage',
      effect: {
        type: 'doubleOrNothing',
        winGold: 5,
        loseDamage: 4,
        rollKey: 'a.win',
      },
    },
    optionB: {
      label: 'Take 3 damage, receive 4 gold',
      effect: {
        type: 'composite',
        effects: [
          { type: 'takeDamage', amount: 3 },
          { type: 'receiveGold', amount: 4 },
        ],
      },
    },
  },
  {
    id: 'heal-or-gold',
    title: 'Heal or gold',
    weight: 'rare',
    optionA: {
      label: 'Heal 1–3 health',
      effect: { type: 'healRange', min: 1, max: 3, rollKey: 'a.heal' },
    },
    optionB: {
      label: 'Receive 1–3 gold',
      effect: { type: 'receiveGoldRange', min: 1, max: 3, rollKey: 'b.gold' },
    },
  },
];

export type { CardWeight };
