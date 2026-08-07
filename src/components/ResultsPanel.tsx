interface ResultsPanelProps {
  players: Array<{
    id: string;
    name: string;
    bankedGold: number;
    status: 'alive' | 'dead' | 'exited';
    isYou: boolean;
  }>;
}

export function ResultsPanel({ players }: ResultsPanelProps) {
  const sorted = [...players].sort((a, b) => b.bankedGold - a.bankedGold);

  return (
    <div className="results-panel">
      <ul className="results-list">
        {sorted.map((player, index) => (
          <li key={player.id} className="results-row">
            <span className="results-rank">{index + 1}</span>
            <div className="results-name">
              <span>{player.name}</span>
              {player.isYou && <span className="tag">you</span>}
            </div>
            <span className="results-gold">{player.bankedGold} gold</span>
            <span className={`status-pill status-${player.status}`}>
              {player.status === 'exited' ? 'Banked' : player.status === 'dead' ? 'Died' : 'Alive'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
