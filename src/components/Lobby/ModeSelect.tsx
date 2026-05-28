// src/components/Lobby/ModeSelect.tsx
import { useState } from 'react';
import type { HumanMode } from '../../types/game';

interface Props {
  onModeSelect: (mode: HumanMode) => void;
  onChangeApiKey: () => void;
}

export default function ModeSelect({ onModeSelect, onChangeApiKey }: Props) {
  const [selectedMode, setSelectedMode] = useState<HumanMode>('spectator');

  const modes: { id: HumanMode; title: string; description: string; icon: string }[] = [
    {
      id: 'spectator',
      title: 'Spectator',
      description: 'Watch AI agents play against each other. Full auto-play with speed controls.',
      icon: '👁️',
    },
    {
      id: 'player',
      title: 'Human Player',
      description: 'Play as one of the agents. Take control or let AI play your turns.',
      icon: '🎮',
    },
    {
      id: 'director',
      title: 'Director',
      description: 'All AI agents, but you can whisper secret instructions each round.',
      icon: '🎬',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#131313] text-[#e2e2e2] font-pixel">
      <h1 className="text-3xl font-bold text-[#e8a84c] mb-8 uppercase tracking-tighter">
        Choose Your Mode
      </h1>

      <div className="grid gap-3 max-w-lg w-full">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={`p-5 border text-left transition-all ${
              selectedMode === mode.id
                ? 'border-[#e8a84c] bg-[#e8a84c]/10'
                : 'border-[#353535] bg-[#1b1b1b] hover:border-[#555]'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl">{mode.icon}</span>
              <div>
                <h3 className="text-lg text-[#e2e2e2] font-bold">
                  {mode.title}
                </h3>
                <p className="text-[#7a7d8a] text-sm mt-1">{mode.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => onModeSelect(selectedMode)}
        className="mt-8 bg-[#e8a84c] text-[#131313] font-bold px-8 py-3 hover:bg-[#e8a84c]/90 transition-colors uppercase text-xs tracking-wider"
      >
        Continue
      </button>

      <button
        onClick={onChangeApiKey}
        className="mt-4 text-[#7a7d8a] text-xs uppercase tracking-wider hover:text-[#e8a84c] transition-colors"
      >
        Change API Key
      </button>
    </div>
  );
}
