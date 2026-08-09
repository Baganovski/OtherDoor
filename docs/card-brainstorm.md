# Card brainstorm — the untitled selection game

Design notes and the source list for decision pairs implemented in `src/data/cards.ts`.

In play, each pair is a secret **A / B** choice. Runs are **3 rounds**; every **4 choices** survivors **Stay** or **Bank** pocket gold. Winning is ranked by **banked gold**.

Copy the template below for each card pair.

When an option uses a range (e.g. `1-3` or `10-30%`), the computer picks the value — not the player.

On cards where the outcome depends on the majority: if there is no majority (even split), nothing happens.

Cards that need a true minority (or otherwise require 3+ choosers) are tagged `minPlayers: 3` in code and are not dealt when only 2 players remain.

Cards for the last remaining player are tagged `minPlayers: 1` and `maxPlayers: 1` (`**Max players:** 1` in this doc) and are only dealt when exactly one alive chooser remains. Those pairs are harder so the round ends faster.

**Weight** controls how often a pair is offered: `common` > `uncommon` > `rare`. Healing should stay rare — prefer gold and damage for most pairs.

Entries are **numbered** and **ordered by weight** (common → uncommon → rare). When adding a pair, insert it in the right section and renumber all entries.

---

## [N]. [Title]

**Weight:** common | uncommon | rare

- [Decision A]
- [Decision B]

---

## 1. Take damage

**Weight:** common

- Take 1 Damage
- Take 3 damage if more than one player picks this

---

## 2. Majority damage

**Weight:** common

- If the majority picks this, take 1 damage
- If the majority picks this, take 3 damage

---

## 3. Chance damage

**Weight:** common

- 10-30% chance to take 3 damage
- 70-90% chance to take 1 damage

---

## 4. Solo gold

**Weight:** common

- Receive 1 gold
- Receive 3-5 gold if only you pick this

---

## 5. Risk gold

**Weight:** common

- Receive 2 gold, then 40-60% chance to take 1 damage
- Receive 1 gold

---

## 6. Crowd gold

**Weight:** common

- Receive 1 gold
- Receive 3 gold if more than one player picks this

---

## 7. Safe vs gamble

**Weight:** common

- 5-20% chance to take 4 damage
- 80-95% chance to take 1 damage

---

## 8. Blood money

**Weight:** common

- Take 2 damage, receive 3 gold
- 50% chance to receive 1 damage

---

## 9. Parity gold

**Weight:** common

- Receive 1-2 gold if an odd number of players pick this
- Receive 1-2 gold if an even number of players pick this

---

## 10. Parity pain

**Weight:** common

- Take 1 damage if an odd number of players pick this
- Take 2 damage if an even number of players pick this

---

## 11. Blood toll

**Weight:** common

**Max players:** 1

- Take 2 damage, receive 3 gold
- Take 1 damage, receive 1 gold

---

## 12. Spike or grind

**Weight:** common

**Max players:** 1

- 20-35% chance to take 5 damage
- Take 2 damage, receive 2 gold

---

## 13. Majority gold

**Weight:** uncommon

- If the majority picks this, receive 1 gold
- If the majority picks this, receive 2-3 gold

---

## 14. Minority reward

**Weight:** uncommon

**Min players:** 3

- If the minority picks this, receive 1 gold
- If the minority picks this, receive 2-3 gold

---

## 15. Safe cut

**Weight:** uncommon

- Receive 2 gold
- Take 1 damage, receive 4 gold

---

## 16. Betrayal bait

**Weight:** uncommon

- Take 1 damage
- Receive 2 gold if only you pick this or take 2 damage if more than one player picks this

---

## 17. Double or nothing

**Weight:** uncommon

- Receive 1 gold
- 50% chance to receive 3 gold or take 2 damage

---

## 18. Pain purse

**Weight:** uncommon

- Take 1 damage, receive 3 gold
- Receive 1 gold

---

## 19. Side bet

**Weight:** uncommon

- Receive 1 gold
- 20-40% chance to receive 3 gold

---

## 20. Greedy cut

**Weight:** uncommon

**Max players:** 1

- Receive 3 gold, then 55-75% chance to take 3 damage
- Take 1 damage, receive 1 gold

---

## 21. All in alone

**Weight:** uncommon

**Max players:** 1

- 50% chance to receive 5 gold or take 4 damage
- Take 3 damage, receive 4 gold

---

## 22. Heal or Gold

**Weight:** rare

- Heal 1-3 Health
- Receive 1-3 Gold

---
