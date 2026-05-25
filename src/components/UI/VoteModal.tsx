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
      case 'kill': return 'Eliminate';
      case 'investigate': return 'Investigate';
      case 'protect': return 'Protect';
      default: return 'Vote for';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-bg-room rounded-lg border border-accent-amber/50 p-6 max-w-md w-full mx-4">
        <h2 className="font-display text-xl text-text-primary mb-4">
          {title}
        </h2>

        <div className="space-y-2 mb-6">
          {eligiblePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedId(player.id)}
              className={`w-full flex items-center gap-3 p-3 rounded border transition-all ${
                selectedId === player.id
                  ? 'border-accent-amber bg-accent-amber/10'
                  : 'border-text-muted/20 hover:border-text-muted/40'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span className="text-text-primary font-body">{player.name}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded border border-text-muted/30 text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => selectedId && onSelect(selectedId)}
            disabled={!selectedId}
            className="flex-1 py-2 rounded bg-accent-amber text-bg-deep font-display font-semibold hover:bg-accent-amber/90 transition-colors disabled:opacity-50"
          >
            {getActionLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}
