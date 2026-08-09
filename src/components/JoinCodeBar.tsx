interface JoinCodeBarProps {
  code: string;
  onLeave: () => void;
  isDemo?: boolean;
}

export function JoinCodeBar({ code, onLeave, isDemo = false }: JoinCodeBarProps) {
  const copyCode = async () => {
    if (isDemo) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard may be unavailable on some mobile browsers.
    }
  };

  return (
    <header className="join-code-bar">
      <div className="join-code-copy">
        <span className="join-code-label">{isDemo ? 'Mode' : 'Join code'}</span>
        {isDemo ? (
          <span className="join-code-value join-code-static">Demo</span>
        ) : (
          <button type="button" className="join-code-value" onClick={copyCode}>
            {code}
          </button>
        )}
      </div>
      <button type="button" className="btn btn-ghost" onClick={onLeave}>
        Leave
      </button>
    </header>
  );
}
