import { useSteppingValue } from '../hooks/useSteppingValue';

interface PlayerHudStatsProps {
  health: number;
  money: number;
  bankedGold: number;
  showHpGold: boolean;
  showBanked: boolean;
  showLost: boolean;
}

export function PlayerHudStats({
  health,
  money,
  bankedGold,
  showHpGold,
  showBanked,
  showLost,
}: PlayerHudStatsProps) {
  const displayedHealth = useSteppingValue(health, { start: showHpGold });
  const healthSettled = !showHpGold || displayedHealth === health;
  const displayedMoney = useSteppingValue(money, { start: showHpGold && healthSettled });
  const moneySettled = !showHpGold || displayedMoney === money;
  const displayedBanked = useSteppingValue(bankedGold, {
    start: showBanked && healthSettled && moneySettled,
  });

  return (
    <>
      {showHpGold && (
        <>
          <span className="stat">
            <span className="stat-label">HP</span>
            <span className="stat-value">{displayedHealth}</span>
          </span>
          <span className="stat">
            <span className="stat-label">Gold</span>
            <span className="stat-value">{displayedMoney}</span>
          </span>
        </>
      )}
      {showBanked && (
        <span className="stat">
          <span className="stat-label">Banked</span>
          <span className="stat-value">{displayedBanked}</span>
        </span>
      )}
      {showLost && (
        <span className="stat stat-lost">
          <span className="stat-label">Lost</span>
          <span className="stat-value">0</span>
        </span>
      )}
    </>
  );
}
