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
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#131313] text-[#e2e2e2] font-pixel">
      <h1 className="text-3xl font-bold text-[#e8a84c] mb-8 uppercase tracking-tighter">
        Game Setup
      </h1>

      {/* Player Count */}
      <div className="bg-[#1b1b1b] border border-[#353535] p-5 max-w-md w-full mb-5">
        <h2 className="text-sm text-[#e2e2e2] mb-3 uppercase tracking-wider font-bold">
          Agent Count
        </h2>
        <div className="flex gap-2">
          {[6, 8, 10].map((count) => (
            <button
              key={count}
              onClick={() => setPlayerCount(count)}
              className={`flex-1 p-3 border text-center transition-all ${
                playerCount === count
                  ? 'border-[#e8a84c] bg-[#e8a84c]/10'
                  : 'border-[#353535] hover:border-[#555]'
              }`}
            >
              <div className="text-xl font-bold text-[#e2e2e2]">{count}</div>
              <div className="text-[#7a7d8a] text-[10px] mt-1 uppercase">Agents</div>
            </button>
          ))}
        </div>
        <p className="text-[#7a7d8a] text-[10px] mt-2 text-center uppercase tracking-wider">
          {getRoleDistribution(playerCount)}
        </p>
      </div>

      {mode === 'player' && (
        <div className="bg-[#1b1b1b] border border-[#353535] p-5 max-w-md w-full mb-5">
          <h2 className="text-sm text-[#e2e2e2] mb-3 uppercase tracking-wider font-bold">
            Preferred Role
          </h2>
          <div className="space-y-1.5">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setRolePreference(role.id)}
                className={`w-full p-2.5 border text-left transition-all ${
                  rolePreference === role.id
                    ? 'border-[#e8a84c] bg-[#e8a84c]/10'
                    : 'border-[#353535] hover:border-[#555]'
                }`}
              >
                <div className="text-[#e2e2e2] text-sm font-bold">{role.label}</div>
                <div className="text-[#7a7d8a] text-[10px]">{role.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#1b1b1b] border border-[#353535] p-5 max-w-md w-full mb-8">
        <h2 className="text-sm text-[#e2e2e2] mb-2 uppercase tracking-wider font-bold">Mission Rules</h2>
        <ul className="text-[#7a7d8a] text-xs space-y-1 list-disc list-inside">
          <li>{getRoleDistribution(playerCount)}</li>
          <li>Night: Mafia kills, Detective investigates, Doctor protects</li>
          <li>Day: Discussion, accusation, vote to eliminate</li>
          <li>Civilians win when all Mafia are eliminated</li>
          <li>Mafia win when they equal or outnumber Civilians</li>
        </ul>
      </div>

      <button
        onClick={() => onNext(playerCount, rolePreference === 'random' ? undefined : rolePreference)}
        className="bg-[#e8a84c] text-[#131313] font-bold px-8 py-3 hover:bg-[#e8a84c]/90 transition-colors uppercase text-xs tracking-wider"
      >
        Configure Agents →
      </button>
    </div>
  );
}
