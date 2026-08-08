import type { PlayerStatus } from '../types/game';

interface GameHudProps {
  players: Array<{
    id: string;
    name: string;
    connected: boolean;
    health: number;
    money: number;
    bankedGold: number;
    status: PlayerStatus;
    hasSubmitted: boolean;
    isYou: boolean;
  }>;
}

function statusLabel(status: PlayerStatus, connected: boolean): string {
  if (!connected) return 'Disconnected';
  switch (status) {
    case 'alive':
      return 'In run';
    case 'dead':
      return 'Dead';
    case 'exited':
      return 'Exited';
    default:
      return '';
  }
}

export function GameHud({ players }: GameHudProps) {
  return (
    <div className="game-hud">
      <ul className="hud-list">
        {players.map((player) => (
          <li
            key={player.id}
            className={`hud-row hud-row-${player.status}${player.connected ? '' : ' hud-row-offline'}`}
          >
            <div className="hud-name">
              <span>{player.name}</span>
              {player.isYou && <span className="tag">you</span>}
              <span className={`status-pill status-${player.status}`}>
                {statusLabel(player.status, player.connected)}
              </span>
            </div>
            <div className="hud-stats">
              {player.status === 'alive' && player.connected && (
                <>
                  <span className="stat">
                    <span className="stat-label">HP</span>
                    <span className="stat-value">{player.health}</span>
                  </span>
                  <span className="stat">
                    <span className="stat-label">Gold</span>
                    <span className="stat-value">{player.money}</span>
                  </span>
                </>
              )}
              {(player.status === 'exited' || player.bankedGold > 0) && (
                <span className="stat">
                  <span className="stat-label">Banked</span>
                  <span className="stat-value">{player.bankedGold}</span>
                </span>
              )}
              {player.status === 'dead' && (
                <span className="stat stat-lost">
                  <span className="stat-label">Lost</span>
                  <span className="stat-value">0</span>
                </span>
              )}
              {player.status === 'alive' && player.connected && (
                <span className={`decision-pill ${player.hasSubmitted ? 'ready' : 'waiting'}`}>
                  {player.hasSubmitted ? 'Decision made' : 'Waiting'}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
