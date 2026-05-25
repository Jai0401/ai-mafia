// src/components/UI/PlayerList.tsx
import type { Player } from '../../types/game';

interface Props {
  players: Player[];
  revealAllRoles: boolean;
  humanPlayerId?: string;
  humanMode?: string;
  onWhisper?: (playerId: string) => void;
  onSelectPlayer?: (playerId: string) => void;
  selectedPlayerId?: string;
}

export default function PlayerList({
  players,
  revealAllRoles,
  humanPlayerId,
  humanMode,
  onWhisper,
  onSelectPlayer,
  selectedPlayerId,
}: Props) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'mafia': return '🗡️';
      case 'detective': return '🔍';
      case 'doctor': return '💉';
      default: return '👤';
    }
  };

  return (
    <div className="w-48 bg-bg-room rounded-lg border border-text-muted/20 p-4 flex flex-col h-full">
      <h3 className="font-display text-sm text-accent-amber uppercase tracking-wider mb-4">
        Players
      </h3>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {players.map((player) => {
          const isDead = !player.isAlive;
          const isHuman = player.id === humanPlayerId;
          const isRevealed = revealAllRoles || isDead;

          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer?.(player.id)}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                selectedPlayerId === player.id
                  ? 'bg-accent-amber/20 border border-accent-amber/50'
                  : 'bg-bg-deep/50 border border-transparent hover:border-text-muted/20'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: player.color,
                  opacity: isDead ? 0.3 : 1,
                  filter: isDead ? 'grayscale(100%)' : 'none',
                }}
              />

              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-body truncate ${
                    isDead ? 'line-through text-text-muted' : 'text-text-primary'
                  }`}
                >
                  {player.name}
                  {isHuman && <span className="text-accent-amber ml-1">👤</span>}
                </div>
                {isRevealed && (
                  <div className="text-xs text-text-muted">
                    {getRoleIcon(player.role)} {player.role}
                  </div>
                )}
              </div>

              {humanMode === 'director' && player.isAlive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWhisper?.(player.id);
                  }}
                  className="text-xs text-accent-amber hover:text-accent-amber/80"
                  title="Whisper"
                >
                  💬
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-text-muted/20">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={revealAllRoles}
            onChange={() => {}}
            className="w-4 h-4 accent-accent-amber"
          />
          <span className="text-xs text-text-muted">Reveal all roles</span>
        </label>
      </div>
    </div>
  );
}
