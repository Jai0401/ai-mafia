// src/components/UI/VoteModal.tsx
import { useState } from 'react';
import type { Player } from '../../types/game';

interface Props {
  isOpen: boolean;
  title: string;
  players: Player[];
  excludePlayerId?: string;
  onSelect: (playerId: string) => void;
  onCancel?: () => void;
  actionType?: 'vote' | 'kill' | 'investigate' | 'protect';
}

export default function VoteModal({
  isOpen,
  title,
  players,
  excludePlayerId,
  onSelect,
  onCancel,
  actionType = 'vote',
}: Props) {
  const [selectedId, setSelectedId] = useState<string>('');

  if (!isOpen) return null;

  const eligiblePlayers = players.filter(
    (p) => p.isAlive && p.id !== excludePlayerId,
  );

  const getActionLabel = () => {
    switch (actionType) {
      case 'kill': return 'ELIMINATE';
      case 'investigate': return 'INVESTIGATE';
      case 'protect': return 'PROTECT';
      default: return 'VOTE';
    }
  };

  const getActionColor = () => {
    switch (actionType) {
      case 'kill': return '#c0392b';
      case 'investigate': return '#4a90d9';
      case 'protect': return '#43e17a';
      default: return '#e8a84c';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 font-pixel">
      <div className="bg-[#1b1b1b] border-2 border-white p-6 max-w-md w-full mx-4 plinth-shadow">
        <h2 className="text-lg font-bold text-[#e2e2e2] uppercase tracking-tight mb-4">
          {title}
        </h2>

        <div className="space-y-1.5 mb-6 max-h-64 overflow-y-auto">
          {eligiblePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedId(player.id)}
              className={`w-full flex items-center gap-3 p-2 border transition-all ${
                selectedId === player.id
                  ? 'border-[#e8a84c] bg-[#e8a84c]/10'
                  : 'border-[#353535] hover:border-[#555]'
              }`}
            >
              <div className="w-8 h-8 bg-[#131313] border border-[#353535] flex-shrink-0">
                <img
                  src={player.avatar}
                  alt=""
                  className="w-full h-full object-contain pixelated"
                />
              </div>
              <span className="text-[#e2e2e2] text-sm font-bold">{player.name}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-2 border border-[#353535] text-[#7a7d8a] hover:text-[#e2e2e2] hover:border-[#555] transition-colors text-xs uppercase font-bold"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => selectedId && onSelect(selectedId)}
            disabled={!selectedId}
            className="flex-1 py-2 text-[#131313] font-bold text-xs uppercase transition-colors disabled:opacity-30"
            style={{
              backgroundColor: selectedId ? getActionColor() : '#353535',
            }}
          >
            {getActionLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}