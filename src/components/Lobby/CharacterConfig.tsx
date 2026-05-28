// src/components/Lobby/CharacterConfig.tsx
import { useState } from 'react';
import type { Player, Role, HatType } from '../../types/game';
import { agentNames, characterColors, hatTypes, characterAvatars } from '../../data/names';
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
  const shuffledAvatars = [...characterAvatars].sort(() => Math.random() - 0.5);
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
    avatar: shuffledAvatars[i % shuffledAvatars.length],
    position: { x: 50, y: 50 },
    targetPosition: { x: 50, y: 50 },
  }));
}

const roleColors: Record<Role, string> = {
  mafia: '#c0392b',
  detective: '#4a90d9',
  doctor: '#43e17a',
  civilian: '#7a7d8a',
};

const roleIcons: Record<Role, string> = {
  mafia: '⚔',
  detective: '🔍',
  doctor: '+',
  civilian: '○',
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
      avatar: characterAvatars[players.length % characterAvatars.length],
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

  const cycleAvatar = (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const currentIndex = characterAvatars.indexOf(player.avatar);
    const nextAvatar = characterAvatars[(currentIndex + 1) % characterAvatars.length];
    updatePlayer(id, 'avatar', nextAvatar);
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
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#131313] text-[#e2e2e2] font-pixel">
      <h1 className="text-3xl font-bold text-[#e8a84c] mb-2 uppercase tracking-tighter">
        Configure Agents
      </h1>
      <p className="text-[#7a7d8a] mb-6 text-sm">
        Customize each agent before the game starts
      </p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={randomizeAll}
          className="px-4 py-2 bg-[#1b1b1b] border border-[#e8a84c]/30 text-[#e8a84c] hover:bg-[#e8a84c]/10 transition-colors text-xs uppercase font-bold"
        >
          🎲 Randomize All
        </button>
        <button
          onClick={addPlayer}
          disabled={players.length >= 12}
          className="px-4 py-2 bg-[#1b1b1b] border border-[#43e17a]/30 text-[#43e17a] hover:bg-[#43e17a]/10 transition-colors disabled:opacity-30 text-xs uppercase font-bold"
        >
          + Add Agent ({players.length}/12)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl w-full mb-8">
        {players.map((player) => (
          <div
            key={player.id}
            className="bg-[#1b1b1b] border border-[#353535] p-3 relative group hover:border-[#e8a84c]/40 transition-colors"
          >
            {/* Remove button */}
            {players.length > 4 && (
              <button
                onClick={() => removePlayer(player.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-[#c0392b] text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border border-[#131313]"
              >
                ✕
              </button>
            )}

            {/* Character preview */}
            <div className="flex justify-center mb-2">
              <div
                className="w-16 h-16 relative cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => cycleAvatar(player.id)}
              >
                <img
                  src={player.avatar}
                  alt=""
                  className="w-full h-full object-contain pixelated"
                />
              </div>
            </div>

            {/* Editable name */}
            <input
              type="text"
              value={player.name}
              onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
              className="w-full bg-[#131313] border border-[#353535] px-2 py-1 text-xs text-[#e2e2e2] text-center font-bold mb-2 focus:outline-none focus:border-[#e8a84c] uppercase tracking-wider"
            />

            {/* Role selector */}
            <button
              onClick={() => cycleRole(player.id)}
              className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-bold mb-1.5 uppercase tracking-wider transition-colors border"
              style={{
                backgroundColor: roleColors[player.role] + '20',
                color: roleColors[player.role],
                borderColor: roleColors[player.role] + '40',
              }}
            >
              {roleIcons[player.role]} {player.role}
            </button>

            {/* Personality selector */}
            <button
              onClick={() => cyclePersonality(player.id)}
              className="w-full text-[10px] text-[#7a7d8a] hover:text-[#e2e2e2] py-0.5 transition-colors"
            >
              {player.personality}
            </button>

            {/* Color toggle */}
            <button
              onClick={() => cycleColor(player.id)}
              className="w-full py-0.5 text-[10px] bg-[#131313] border border-[#353535] hover:border-[#555] transition-colors mt-1.5"
              style={{ color: player.color }}
            >
              ● Color
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-[#353535] text-[#7a7d8a] hover:text-[#e2e2e2] hover:border-[#555] transition-colors text-xs uppercase font-bold"
        >
          Back
        </button>
        <button
          onClick={() => onStart(players)}
          className="px-8 py-2 bg-[#e8a84c] text-[#131313] font-bold hover:bg-[#e8a84c]/90 transition-colors text-xs uppercase"
        >
          Start Game ({players.length} Agents)
        </button>
      </div>
    </div>
  );
}