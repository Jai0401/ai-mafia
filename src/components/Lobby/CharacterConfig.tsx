// src/components/Lobby/CharacterConfig.tsx
import { useState } from 'react';
import type { Player, Role, HatType } from '../../types/game';
import { agentNames, characterColors, hatTypes } from '../../data/names';
import { personalities } from '../../data/personalities';

interface Props {
  playerCount: number;
  onStart: (players: Player[]) => void;
  onBack: () => void;
}

const roleDistribution: Record<number, Role[]> = {
  6: ['mafia', 'mafia', 'detective', 'doctor', 'civilian', 'civilian'],
  8: ['mafia', 'mafia', 'detective', 'doctor', 'civilian', 'civilian', 'civilian', 'civilian'],
  10: ['mafia', 'mafia', 'mafia', 'detective', 'doctor', 'civilian', 'civilian', 'civilian', 'civilian', 'civilian'],
};

function generatePlayers(count: number): Player[] {
  const shuffledNames = [...agentNames].sort(() => Math.random() - 0.5).slice(0, count);
  const shuffledColors = [...characterColors].sort(() => Math.random() - 0.5);
  const shuffledHats = [...hatTypes].sort(() => Math.random() - 0.5);
  const shuffledPersonalities = [...personalities].sort(() => Math.random() - 0.5);
  const roles = roleDistribution[count];

  return shuffledNames.map((name, i) => ({
    id: `player-${i}`,
    name,
    role: roles[i],
    personality: shuffledPersonalities[i % personalities.length].name,
    isAlive: true,
    isHuman: false,
    color: shuffledColors[i % shuffledColors.length],
    hat: shuffledHats[i % shuffledHats.length] as HatType,
    position: { x: 50, y: 50 },
    targetPosition: { x: 50, y: 50 },
  }));
}

const roleColors: Record<Role, string> = {
  mafia: '#c0392b',
  detective: '#4a90d9',
  doctor: '#2ecc71',
  civilian: '#7a7d8a',
};

const roleIcons: Record<Role, string> = {
  mafia: '🗡️',
  detective: '🔍',
  doctor: '💉',
  civilian: '👤',
};

export default function CharacterConfig({ playerCount, onStart, onBack }: Props) {
  const [players, setPlayers] = useState<Player[]>(() => generatePlayers(playerCount));

  const updatePlayer = (id: string, field: keyof Player, value: any) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPlayer = () => {
    if (players.length >= 12) return;
    const newId = `player-${players.length}`;
    const allNames = [...agentNames, 'Nova', 'Atlas', 'Raven', 'Orion', 'Lyra', 'Cassius', 'Zara', 'Kael'];
    const usedNames = new Set(players.map(p => p.name));
    const availableName = allNames.find(n => !usedNames.has(n)) || `Agent-${players.length + 1}`;
    
    const newPlayer: Player = {
      id: newId,
      name: availableName,
      role: 'civilian',
      personality: personalities[0].name,
      isAlive: true,
      isHuman: false,
      color: characterColors[players.length % characterColors.length],
      hat: hatTypes[players.length % hatTypes.length] as HatType,
      position: { x: 50, y: 50 },
      targetPosition: { x: 50, y: 50 },
    };
    setPlayers(prev => [...prev, newPlayer]);
  };

  const removePlayer = (id: string) => {
    if (players.length <= 4) return;
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const randomizeAll = () => {
    setPlayers(generatePlayers(players.length));
  };

  const cycleRole = (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const roles: Role[] = ['civilian', 'detective', 'doctor', 'mafia'];
    const currentIndex = roles.indexOf(player.role);
    const nextRole = roles[(currentIndex + 1) % roles.length];
    updatePlayer(id, 'role', nextRole);
  };

  const cycleHat = (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const currentIndex = hatTypes.indexOf(player.hat);
    const nextHat = hatTypes[(currentIndex + 1) % hatTypes.length];
    updatePlayer(id, 'hat', nextHat);
  };

  const cycleColor = (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const currentIndex = characterColors.indexOf(player.color);
    const nextColor = characterColors[(currentIndex + 1) % characterColors.length];
    updatePlayer(id, 'color', nextColor);
  };

  const cyclePersonality = (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const currentIndex = personalities.findIndex(p => p.name === player.personality);
    const nextPersonality = personalities[(currentIndex + 1) % personalities.length];
    updatePlayer(id, 'personality', nextPersonality.name);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="font-display text-4xl font-bold text-accent-amber mb-2">
        Configure Characters
      </h1>
      <p className="text-text-muted mb-6">
        Customize each agent before the game starts
      </p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={randomizeAll}
          className="px-4 py-2 bg-bg-room border border-accent-amber/30 rounded text-accent-amber hover:bg-accent-amber/10 transition-colors"
        >
          🎲 Randomize All
        </button>
        <button
          onClick={addPlayer}
          disabled={players.length >= 12}
          className="px-4 py-2 bg-bg-room border border-green-400/30 rounded text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-30"
        >
          ➕ Add Player ({players.length}/12)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
        {players.map((player) => (
          <div
            key={player.id}
            className="bg-bg-room rounded-lg border border-text-muted/20 p-4 relative group hover:border-accent-amber/40 transition-colors"
          >
            {/* Remove button */}
            {players.length > 4 && (
              <button
                onClick={() => removePlayer(player.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-accent-red rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ✕
              </button>
            )}

            {/* Character preview */}
            <div className="flex justify-center mb-3">
              <svg width="48" height="56" viewBox="0 0 64 72">
                <ellipse cx="32" cy="68" rx="16" ry="3" fill="rgba(0,0,0,0.3)" />
                <rect x="14" y="24" width="36" height="32" rx="14" fill={player.color} />
                <rect x="24" y="30" width="22" height="12" rx="6" fill="#1a1a2e" />
                <rect x="26" y="32" width="18" height="8" rx="4" fill="#16213e" />
                <ellipse cx="40" cy="36" rx="3" ry="2" fill="rgba(255,255,255,0.4)" />
                <rect x="22" y="52" width="8" height="10" rx="3" fill={player.color} />
                <rect x="34" y="52" width="8" height="10" rx="3" fill={player.color} />
                {/* Hat indicator */}
                <circle cx="48" cy="18" r="8" fill={player.color} opacity="0.6" />
                <text x="48" y="22" textAnchor="middle" fontSize="10">{player.hat === 'duck' ? '🦆' : player.hat === 'tophat' ? '🎩' : player.hat === 'bowler' ? '🎯' : player.hat === 'beret' ? '🎨' : player.hat === 'crown' ? '👑' : '🧢'}</text>
              </svg>
            </div>

            {/* Editable name */}
            <input
              type="text"
              value={player.name}
              onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
              className="w-full bg-bg-deep border border-text-muted/20 rounded px-2 py-1 text-sm text-text-primary text-center font-display mb-2 focus:outline-none focus:border-accent-amber"
            />

            {/* Role selector */}
            <button
              onClick={() => cycleRole(player.id)}
              className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-bold mb-2 transition-colors"
              style={{ 
                backgroundColor: roleColors[player.role] + '20',
                color: roleColors[player.role],
                border: `1px solid ${roleColors[player.role]}40`
              }}
            >
              {roleIcons[player.role]} {player.role.toUpperCase()}
            </button>

            {/* Personality selector */}
            <button
              onClick={() => cyclePersonality(player.id)}
              className="w-full text-xs text-text-muted hover:text-text-primary py-1 transition-colors"
            >
              {player.personality}
            </button>

            {/* Color and Hat toggles */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => cycleColor(player.id)}
                className="flex-1 py-1 rounded text-xs bg-bg-deep border border-text-muted/20 hover:border-text-muted/40 transition-colors"
                style={{ color: player.color }}
              >
                ● Color
              </button>
              <button
                onClick={() => cycleHat(player.id)}
                className="flex-1 py-1 rounded text-xs bg-bg-deep border border-text-muted/20 hover:border-text-muted/40 transition-colors text-text-muted"
              >
                🎩 Hat
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded border border-text-muted/30 text-text-muted hover:text-text-primary transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onStart(players)}
          className="px-8 py-2 rounded bg-accent-amber text-bg-deep font-display font-semibold hover:bg-accent-amber/90 transition-colors"
        >
          Start Game ({players.length} Players)
        </button>
      </div>
    </div>
  );
}
