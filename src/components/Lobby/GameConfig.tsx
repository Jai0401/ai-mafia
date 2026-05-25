// src/components/Lobby/GameConfig.tsx
import { useState } from 'react';
import type { HumanMode } from '../../types/game';

interface Props {
  mode: HumanMode;
  onNext: (playerCount: number, rolePreference?: string) => void;
}

export default function GameConfig({ mode, onNext }: Props) {
  const [rolePreference, setRolePreference] = useState<string>('random');
  const [playerCount, setPlayerCount] = useState<number>(6);

  const roles: { id: string; label: string; description: string }[] = [
    { id: 'random', label: 'Random', description: 'Let fate decide your role' },
    { id: 'mafia', label: 'Mafia', description: 'Deceive and eliminate civilians' },
    { id: 'detective', label: 'Detective', description: 'Investigate and find the truth' },
    { id: 'doctor', label: 'Doctor', description: 'Protect the innocent' },
    { id: 'civilian', label: 'Civilian', description: 'Survive and vote wisely' },
  ];

  const getRoleDistribution = (count: number) => {
    if (count === 6) return '2 Mafia, 1 Detective, 1 Doctor, 2 Civilians';
    if (count === 8) return '2 Mafia, 1 Detective, 1 Doctor, 4 Civilians';
    if (count === 10) return '3 Mafia, 1 Detective, 1 Doctor, 5 Civilians';
    return '';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="font-display text-4xl font-bold text-accent-amber mb-8">
        Game Setup
      </h1>

      {/* Player Count */}
      <div className="bg-bg-room rounded-lg p-6 max-w-md w-full border border-text-muted/20 mb-6">
        <h2 className="font-display text-lg text-text-primary mb-4">
          Player Count
        </h2>
        <div className="flex gap-3">
          {[6, 8, 10].map((count) => (
            <button
              key={count}
              onClick={() => setPlayerCount(count)}
              className={`flex-1 p-3 rounded border text-center transition-all ${
                playerCount === count
                  ? 'border-accent-amber bg-accent-amber/10'
                  : 'border-text-muted/20 hover:border-text-muted/40'
              }`}
            >
              <div className="font-display text-xl font-bold text-text-primary">{count}</div>
              <div className="text-text-muted text-xs mt-1">Players</div>
            </button>
          ))}
        </div>
        <p className="text-text-muted text-xs mt-3 text-center">
          {getRoleDistribution(playerCount)}
        </p>
      </div>

      {mode === 'player' && (
        <div className="bg-bg-room rounded-lg p-6 max-w-md w-full border border-text-muted/20 mb-6">
          <h2 className="font-display text-lg text-text-primary mb-4">
            Preferred Role
          </h2>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setRolePreference(role.id)}
                className={`w-full p-3 rounded border text-left transition-all ${
                  rolePreference === role.id
                    ? 'border-accent-amber bg-accent-amber/10'
                    : 'border-text-muted/20 hover:border-text-muted/40'
                }`}
              >
                <div className="font-body text-text-primary font-semibold">{role.label}</div>
                <div className="text-text-muted text-xs">{role.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-bg-room rounded-lg p-6 max-w-md w-full border border-text-muted/20 mb-8">
        <h2 className="font-display text-lg text-text-primary mb-2">Game Rules</h2>
        <ul className="text-text-muted text-sm space-y-1 list-disc list-inside">
          <li>{getRoleDistribution(playerCount)}</li>
          <li>Night: Mafia kills, Detective investigates, Doctor protects</li>
          <li>Day: Discussion, accusation, vote to eliminate</li>
          <li>Civilians win when all Mafia are eliminated</li>
          <li>Mafia win when they equal or outnumber Civilians</li>
        </ul>
      </div>

      <button
        onClick={() => onNext(playerCount, rolePreference === 'random' ? undefined : rolePreference)}
        className="bg-accent-amber text-bg-deep font-display font-semibold px-8 py-3 rounded hover:bg-accent-amber/90 transition-colors"
      >
        Configure Characters →
      </button>
    </div>
  );
}
