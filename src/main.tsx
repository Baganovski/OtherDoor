import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameRoomProvider } from './context/GameRoomContext';
import { App } from './App';
import { AppVersion } from './components/AppVersion';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameRoomProvider>
      <App />
    </GameRoomProvider>
    <AppVersion />
  </StrictMode>,
);
