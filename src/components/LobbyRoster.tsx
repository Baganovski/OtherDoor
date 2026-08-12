interface LobbyRosterProps {
  connectedCount: number;
  canAddBot: boolean;
  onAddBot: () => void;
  onRemoveBot: (playerId: string) => void;
  players: Array<{
    id: string;
    name: string;
    connected: boolean;
    isHost: boolean;
    isYou: boolean;
    isBot: boolean;
  }>;
}

export function LobbyRoster({
  players,
  connectedCount,
  canAddBot,
  onAddBot,
  onRemoveBot,
}: LobbyRosterProps) {
  const seats = Array.from({ length: 6 }, (_, index) => players[index] ?? null);

  return (
    <div className="roster">
      <div className="roster-meta">
        <span>{connectedCount} connected</span>
        <span>{6 - connectedCount} seats open</span>
      </div>
      <ul className="roster-list">
        {seats.map((player, index) => (
          <li key={player?.id ?? `empty-${index}`} className="roster-seat">
            {player ? (
              <>
                <span className="seat-name">
                  {player.name}
                  {player.isYou ? ' (you)' : ''}
                </span>
                <span className="seat-tags">
                  {player.isHost && <span className="tag">host</span>}
                  {player.isBot && <span className="tag">bot</span>}
                  {!player.connected && <span className="tag tag-muted">away</span>}
                  {player.isBot && (
                    <button
                      type="button"
                      className="btn btn-ghost seat-remove-bot"
                      onClick={() => onRemoveBot(player.id)}
                    >
                      Remove
                    </button>
                  )}
                </span>
              </>
            ) : (
              <span className="seat-empty">Empty seat</span>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={!canAddBot}
        onClick={onAddBot}
      >
        {canAddBot ? 'Add bot' : 'No seats left'}
      </button>
    </div>
  );
}
