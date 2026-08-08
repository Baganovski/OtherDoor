import { useState } from 'react';
import { useGameRoom } from './context/GameRoomContext';
import { RoomShell } from './components/RoomShell';
import { TypewriterText, TYPE_SPEED, TYPE_START_DELAY } from './components/TypewriterText';
import { MAX_PLAYERS, MIN_PLAYERS } from './types/game';

type Screen = 'home' | 'create' | 'join';

const HOME_BRAND = 'the untitled selection game';
const HOME_HEADLINE = 'Pick a side. Bank your gold.';
const HOME_LEDE =
  'A phone-to-phone party game. Create a room, share the code, and lock in your choices.';

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
    submitStayExit,
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
    const localCanAct =
      localPlayer?.status === 'alive' && localPlayer.connected === true;

    return (
      <RoomShell
        roomCode={state.roomCode}
        phase={state.phase}
        connectedCount={connectedPlayers.length}
        canStart={
          connectedPlayers.length >= MIN_PLAYERS &&
          connectedPlayers.length <= MAX_PLAYERS &&
          state.phase === 'lobby'
        }
        onStart={startGame}
        onLeave={leaveRoom}
        roster={state.players.map((player) => ({
          id: player.id,
          name: player.name,
          connected: player.connected,
          isHost: player.id === state.hostPlayerId,
          isYou: player.id === state.localPlayerId,
        }))}
        players={state.players.map((player) => ({
          id: player.id,
          name: player.name,
          connected: player.connected,
          health: player.health,
          money: player.money,
          bankedGold: player.bankedGold,
          status: player.status,
          hasSubmitted: player.hasSubmitted,
          isYou: player.id === state.localPlayerId,
        }))}
        blockNumber={state.blockNumber}
        choiceIndexInBlock={state.choiceIndexInBlock}
        currentCard={state.currentCard}
        localHasSubmitted={localPlayer?.hasSubmitted ?? false}
        localCanAct={localCanAct}
        onSubmitChoice={submitChoice}
        onSubmitStayExit={submitStayExit}
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
          <TypewriterText
            as="p"
            className="brand"
            text={HOME_BRAND}
            speed={TYPE_SPEED}
            delay={TYPE_START_DELAY}
            replayKey="home"
          />
          <h1>{HOME_HEADLINE}</h1>
          <p className="home-lede">{HOME_LEDE}</p>
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
                  {isConnecting ? 'Creating room…' : 'Create & join'}
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
