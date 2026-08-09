import type { PlayerStatus } from '../types/game';
import { PlayerHudStats } from './PlayerHudStats';

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
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isYou) return -1;
    if (b.isYou) return 1;
    return 0;
  });

  return (
    <div className="game-hud">
      <ul className="hud-list">
        {sortedPlayers.map((player) => {
          const showHpGold = player.status === 'alive' && player.connected;
          const showBanked = player.status === 'exited' || player.bankedGold > 0;
          const showLost = player.status === 'dead';

          return (
            <li
              key={player.id}
              className={`hud-row hud-row-${player.status}${player.connected ? '' : ' hud-row-offline'}${player.isYou ? ' hud-row-you' : ''}`}
            >
              <div className="hud-name">
                <span>{player.name}</span>
                {player.isYou && <span className="tag">you</span>}
                <span className={`status-pill status-${player.status}`}>
                  {statusLabel(player.status, player.connected)}
                </span>
              </div>
              <div className="hud-stats">
                <PlayerHudStats
                  health={player.health}
                  money={player.money}
                  bankedGold={player.bankedGold}
                  showHpGold={showHpGold}
                  showBanked={showBanked}
                  showLost={showLost}
                />
                {showHpGold && (
                  <span className={`decision-pill ${player.hasSubmitted ? 'ready' : 'waiting'}`}>
                    {player.hasSubmitted ? 'Decision made' : 'Waiting'}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
