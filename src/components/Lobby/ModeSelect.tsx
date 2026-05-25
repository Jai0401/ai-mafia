// src/components/Lobby/ModeSelect.tsx
import { useState } from 'react';
import type { HumanMode } from '../../types/game';

interface Props {
  onModeSelect: (mode: HumanMode) => void;
}

export default function ModeSelect({ onModeSelect }: Props) {
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
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="font-display text-4xl font-bold text-accent-amber mb-8">
        Choose Your Mode
      </h1>

      <div className="grid gap-4 max-w-lg w-full">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={`p-6 rounded-lg border-2 text-left transition-all ${
              selectedMode === mode.id
                ? 'border-accent-amber bg-accent-amber/10'
                : 'border-text-muted/20 bg-bg-room hover:border-text-muted/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{mode.icon}</span>
              <div>
                <h3 className="font-display text-lg text-text-primary font-semibold">
                  {mode.title}
                </h3>
                <p className="text-text-muted text-sm mt-1">{mode.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => onModeSelect(selectedMode)}
        className="mt-8 bg-accent-amber text-bg-deep font-display font-semibold px-8 py-3 rounded hover:bg-accent-amber/90 transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
