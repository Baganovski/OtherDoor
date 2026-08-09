import { useSteppingValue } from '../hooks/useSteppingValue';
import { useStatFlash } from '../hooks/useStatFlash';

interface PlayerHudStatsProps {
  health: number;
  money: number;
  bankedGold: number;
  showHpGold: boolean;
  showBanked: boolean;
  showLost: boolean;
}

function flashClass(flash: 'up' | 'down' | null): string {
  if (flash === 'up') return ' stat-value-up';
  if (flash === 'down') return ' stat-value-down';
  return '';
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

  const healthFlash = useStatFlash(health);
  const moneyFlash = useStatFlash(money);
  const bankedFlash = useStatFlash(bankedGold);

  return (
    <>
      {showHpGold && (
        <>
          <span className="stat">
            <span className="stat-label">HP</span>
            <span className={`stat-value${flashClass(healthFlash)}`}>{displayedHealth}</span>
          </span>
          <span className="stat">
            <span className="stat-label">Gold</span>
            <span className={`stat-value${flashClass(moneyFlash)}`}>{displayedMoney}</span>
          </span>
        </>
      )}
      {showBanked && (
        <span className="stat">
          <span className="stat-label">Banked</span>
          <span className={`stat-value${flashClass(bankedFlash)}`}>{displayedBanked}</span>
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
