import { useState } from 'react';
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
        />
      )}
      {phase === 'game_config' && (
        <GameConfig
          mode={humanMode}
          onNext={(playerCount) => {
            setSelectedPlayerCount(playerCount);
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
      {phase === 'game' && <Game apiKey={apiKey} preConfiguredPlayers={configuredPlayers} />}
    </GameProvider>
  );
}
