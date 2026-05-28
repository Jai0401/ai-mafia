import { useState, useEffect, useCallback } from 'react';
import { GameProvider } from './context/GameContext';
import type { Player } from './types/game';
import type { HumanMode } from './types/game';
import ApiKeyInput from './components/Lobby/ApiKeyInput';
import ModeSelect from './components/Lobby/ModeSelect';
import GameConfig from './components/Lobby/GameConfig';
import CharacterConfig from './components/Lobby/CharacterConfig';
import Game from './components/Game';

type AppPhase = 'api_key' | 'mode_select' | 'game_config' | 'character_config' | 'game';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('api_key');
  const [apiKey, setApiKey] = useState('');
  const [humanMode, setHumanMode] = useState<HumanMode>('spectator');
  const [configuredPlayers, setConfiguredPlayers] = useState<Player[] | undefined>(undefined);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<number>(6);
  const [rolePreference, setRolePreference] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Check for persisted API key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('ai-mafia-api-key');
    if (storedKey) {
      // Validate the stored key before skipping the screen
      fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${storedKey}` },
      })
        .then((response) => {
          if (response.ok) {
            setApiKey(storedKey);
            setPhase('mode_select');
          } else {
            // Key invalid, clear it
            localStorage.removeItem('ai-mafia-api-key');
          }
        })
        .catch(() => {
          // Network error, keep the key and let the user decide
          setApiKey(storedKey);
          setPhase('mode_select');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleChangeApiKey = useCallback(() => {
    localStorage.removeItem('ai-mafia-api-key');
    setApiKey('');
    setPhase('api_key');
  }, []);

  const handleGameOver = useCallback(() => {
    setConfiguredPlayers(undefined);
    setPhase('mode_select');
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#131313] text-[#e8a84c] font-pixel">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#e8a84c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <GameProvider>
      {phase === 'api_key' && (
        <ApiKeyInput
          onKeySubmit={(key) => {
            setApiKey(key);
            setPhase('mode_select');
          }}
        />
      )}
      {phase === 'mode_select' && (
        <ModeSelect
          onModeSelect={(mode) => {
            setHumanMode(mode);
            setPhase('game_config');
          }}
          onChangeApiKey={handleChangeApiKey}
        />
      )}
      {phase === 'game_config' && (
        <GameConfig
          mode={humanMode}
          onNext={(playerCount, pref) => {
            setSelectedPlayerCount(playerCount);
            setRolePreference(pref);
            setPhase('character_config');
          }}
        />
      )}
      {phase === 'character_config' && (
        <CharacterConfig
          playerCount={selectedPlayerCount}
          onStart={(players) => {
            setConfiguredPlayers(players);
            setPhase('game');
          }}
          onBack={() => setPhase('game_config')}
        />
      )}
      {phase === 'game' && (
        <Game
          apiKey={apiKey}
          humanMode={humanMode}
          rolePreference={rolePreference}
          preConfiguredPlayers={configuredPlayers}
          onGameOver={handleGameOver}
        />
      )}
    </GameProvider>
  );
}
