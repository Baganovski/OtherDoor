# OtherDoor

Phone-to-phone web party game foundation inspired by *Another Door*.

## Features

- Create or join a room with a 6-character code
- Up to 6 players in a peer-hosted lobby
- Join code pinned at the top of the screen
- Any player can start once there are 2–6 connected players
- Shared health and gems visible on every phone
- Simultaneous secret choices; round resolves when all connected players lock in
- Dropped players are removed and the game continues
- Host migration when the current host disconnects

## Tech

- Vite + React + TypeScript
- PeerJS for WebRTC signaling and peer connections

## Run locally

```bash
npm install
npm run dev
```

Open the dev server URL on multiple phones/browsers to test. For real devices on the same network, use your machine's LAN IP (Vite is configured with `host: true`).

## How to test multiplayer

1. Open the app on device A → **Create game**
2. Copy/share the join code from the top bar
3. Open on devices B–F → **Join game** with the code and unique names
4. Any player taps **Open the door** once at least 2 players are connected (up to 6)
5. Each player locks a choice; when all connected players submit, the round resolves
6. Disconnect one phone to verify the game continues without them

## Notes

- PeerJS provides signaling only; game state is held on the host phone
- Rooms disappear when the last player leaves (no server-side expiry)
- Rejoin with the same name is supported if that seat was vacated and the room is still live
