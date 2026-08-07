interface GameHudProps {
  players: Array<{
    id: string;
    name: string;
    connected: boolean;
    health: number;
    money: number;
    hasSubmitted: boolean;
    isYou: boolean;
  }>;
}

export function GameHud({ players }: GameHudProps) {
  const activePlayers = players.filter((player) => player.connected);

  return (
    <div className="game-hud">
      <ul className="hud-list">
        {activePlayers.map((player) => (
          <li key={player.id} className="hud-row">
            <div className="hud-name">
              <span>{player.name}</span>
              {player.isYou && <span className="tag">you</span>}
            </div>
            <div className="hud-stats">
              <span className="stat">
                <span className="stat-label">HP</span>
                <span className="stat-value">{player.health}</span>
              </span>
              <span className="stat">
                <span className="stat-label">Gems</span>
                <span className="stat-value">{player.money}</span>
              </span>
              <span className={`decision-pill ${player.hasSubmitted ? 'ready' : ''}`}>
                {player.hasSubmitted ? 'Locked' : 'Choosing'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
