# the untitled selection game

**Pick a side. Bank your gold.**

A phone-to-phone party game. Create a room, share the code, and lock in your choices. Add bots in the lobby to fill seats.

| | |
|---|---|
| **Play** | [baganovski.github.io/TheUntitledSelectionGame](https://baganovski.github.io/TheUntitledSelectionGame/) |
| **Repo** | [github.com/Baganovski/TheUntitledSelectionGame](https://github.com/Baganovski/TheUntitledSelectionGame) |

## How to play

Each **run** lasts **3 rounds**. You start every round with **10 HP** and **0 pocket gold**. **Banked gold** is safe and carries across rounds.

### 1. Secret A / B choices

- Each beat deals a weighted decision card (**common**, **uncommon**, or **rare**).
- Pick **A** or **B** in secret. The card resolves when every **alive, connected** player still in the round has locked in.
- Effects can change HP and pocket gold — damage, gold, majority/minority outcomes, solo rewards, chance rolls, healing, and more.
- HP is clamped between **0** and **10**.

### 2. Stay or Bank (every 4 choices)

After **4 choices**, survivors choose:

- **Bank** — pocket gold moves into your bank; you sit out the rest of this round.
- **Stay** — stay in for **4 more choices**, then another Stay/Bank checkpoint.

If at least one player stays, a new **block** begins (block 2, 3, …) within the same round.

### 3. Round end and between rounds

A **round** ends when no connected player is still **alive** in that round (everyone banked or died).

- **Exited** (banked) players return for the next round.
- **Dead** players stay out for the rest of the run.
- Survivors heal to **10 HP**; unbanked pocket gold is wiped (it is **not** auto-banked).

### 4. Death

Drop to **0 HP** and you **die**: pocket gold is lost, and you are out for the remaining rounds.

### 5. Winning

After round 3, **final standings** rank players by **banked gold**. Highest bank wins.

## Getting started

### Multiplayer (2–6 players)

1. **Create game** — enter your name (up to 20 characters); you get a **6-letter** room code.
2. Share the code — tap it in the top bar to copy.
3. Others choose **Join game**, enter the code and a **unique** name.
4. In the lobby, anyone can **Add bot** to fill empty seats (up to 6 total).
5. When **2–6** players (humans and/or bots) are connected, anyone can tap **Start the game**.
6. Play through three rounds; compare banked gold on the final standings screen.

Peer-to-peer over **PeerJS**: the host phone holds game state and runs bots; signaling only goes through PeerJS. Bots weigh risk vs reward and usually bank near **5 HP**.

## Features

- Join code pinned at the top of every screen (copyable in multiplayer)
- Live HUD on every phone: HP, pocket gold, banked gold, and status
- Lobby roster with host / you / bot tags; add or remove bots before start
- Simultaneous secret choices and Stay/Bank checkpoints
- **20** weighted decision pairs — see [`docs/card-brainstorm.md`](docs/card-brainstorm.md) and [`src/data/cards.ts`](src/data/cards.ts)
- Dropped players are removed from active play; the run continues
- Host migrates to the next connected player if the host leaves
- Rejoin with the same name if that seat was vacated and the room is still live

## Tech

- **Vite** + **React** + **TypeScript**
- **PeerJS** for WebRTC signaling and peer connections
- Deployed to **GitHub Pages** from `master` (base path `/TheUntitledSelectionGame/`)

## Run locally

```bash
npm install
npm run dev
```

Open the dev server URL on multiple phones or browsers. For real devices on the same Wi‑Fi, use your machine's LAN IP — Vite is configured with `host: true`.

## Notes

- Rooms disappear when the last player leaves (no server-side expiry).
- You cannot join a room that is full, already in progress, or already using your name.
- Card design notes and the full pair list: [`docs/card-brainstorm.md`](docs/card-brainstorm.md).
