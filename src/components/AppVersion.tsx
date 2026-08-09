export function AppVersion() {
  return (
    <p className="app-version" aria-label={`App version ${__APP_VERSION__}`}>
      v{__APP_VERSION__}
    </p>
  );
}
