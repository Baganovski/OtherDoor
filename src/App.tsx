import { useState } from 'react';
import { useGameRoom } from './context/GameRoomContext';
import { RoomShell } from './components/RoomShell';
import { MAX_PLAYERS } from './types/game';

type Screen = 'home' | 'create' | 'join';

export function App() {
  const {
    state,
    notice,
    error,
    isConnecting,
    createRoom,
    joinRoom,
    startGame,
    submitChoice,
    leaveRoom,
    clearNotice,
    clearError,
  } = useGameRoom();

  const [screen, setScreen] = useState<Screen>('home');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  if (state) {
    const connectedPlayers = state.players.filter((player) => player.connected);
    const localPlayer = state.players.find((player) => player.id === state.localPlayerId);

    return (
      <RoomShell
        roomCode={state.roomCode}
        phase={state.phase}
        connectedCount={connectedPlayers.length}
        canStart={connectedPlayers.length === MAX_PLAYERS && state.phase === 'lobby'}
        onStart={startGame}
        onLeave={leaveRoom}
        roster={state.players.map((player) => ({
          id: player.id,
          name: player.name,
          connected: player.connected,
          isHost: player.id === state.hostPlayerId,
          isYou: player.id === state.localPlayerId,
        }))}
        players={connectedPlayers.map((player) => ({
          id: player.id,
          name: player.name,
          connected: player.connected,
          health: player.health,
          money: player.money,
          hasSubmitted: player.hasSubmitted,
          isYou: player.id === state.localPlayerId,
        }))}
        round={state.round}
        localHasSubmitted={localPlayer?.hasSubmitted ?? false}
        onSubmitChoice={submitChoice}
        notice={notice}
        error={error}
        onDismissNotice={clearNotice}
        onDismissError={clearError}
      />
    );
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!playerName.trim()) return;
    await createRoom(playerName);
  };

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!playerName.trim() || !joinCode.trim()) return;
    await joinRoom(joinCode, playerName);
  };

  return (
    <div className="app-shell">
      <div className="home-backdrop" aria-hidden="true" />

      <main className="home-main">
        <header className="home-hero">
          <p className="brand">OtherDoor</p>
          <h1>Step through together.</h1>
          <p className="home-lede">
            A phone-to-phone party game. Create a room, share the code, and survive what waits behind the door.
          </p>
        </header>

        {screen === 'home' && (
          <section className="home-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setScreen('create')}
            >
              Create game
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setScreen('join')}
            >
              Join game
            </button>
          </section>
        )}

        {screen === 'create' && (
          <section className="panel home-panel">
            <form className="home-form" onSubmit={handleCreate}>
              <label htmlFor="create-name">Your name</label>
              <input
                id="create-name"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="What should they call you?"
                autoComplete="nickname"
                maxLength={20}
                required
              />
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setScreen('home')}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={isConnecting}>
                  {isConnecting ? 'Opening door…' : 'Create & join'}
                </button>
              </div>
            </form>
          </section>
        )}

        {screen === 'join' && (
          <section className="panel home-panel">
            <form className="home-form" onSubmit={handleJoin}>
              <label htmlFor="join-code">Join code</label>
              <input
                id="join-code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="6-letter code"
                autoComplete="off"
                maxLength={6}
                required
              />
              <label htmlFor="join-name">Your name</label>
              <input
                id="join-name"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="What should they call you?"
                autoComplete="nickname"
                maxLength={20}
                required
              />
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setScreen('home')}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={isConnecting}>
                  {isConnecting ? 'Connecting…' : 'Enter room'}
                </button>
              </div>
            </form>
          </section>
        )}

        {error && (
          <p className="home-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
