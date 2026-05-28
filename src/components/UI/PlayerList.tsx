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
      case 'mafia': return '⚔';
      case 'detective': return '🔍';
      case 'doctor': return '+';
      default: return '○';
    }
  };

  return (
    <div className="w-52 bg-[#1b1b1b] border-r-2 border-[#353535] p-3 flex flex-col h-full font-pixel">
      <h3 className="text-xs text-[#e8a84c] uppercase tracking-widest mb-3 font-bold">
        Agents
      </h3>

      <div className="space-y-1.5 flex-1 overflow-y-auto">
        {players.map((player) => {
          const isDead = !player.isAlive;
          const isHuman = player.id === humanPlayerId;
          const isRevealed = revealAllRoles || isDead;

          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer?.(player.id)}
              className={`flex items-center gap-2 p-1.5 cursor-pointer transition-all border ${
                selectedPlayerId === player.id
                  ? 'bg-[#e8a84c]/10 border-[#e8a84c]/50'
                  : 'bg-[#131313]/50 border-transparent hover:border-[#555]'
              }`}
            >
              {/* Character avatar thumbnail */}
              <div className="w-8 h-8 flex-shrink-0 relative">
                <img
                  src={player.avatar}
                  alt=""
                  className="w-full h-full object-contain pixelated"
                  style={{
                    opacity: isDead ? 0.3 : 1,
                    filter: isDead ? 'grayscale(100%) brightness(0.5)' : 'none',
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className={`text-[11px] truncate font-bold ${
                    isDead ? 'line-through text-[#5b403b]' : 'text-[#e2e2e2]'
                  }`}
                >
                  {player.name}
                  {isHuman && <span className="text-[#e8a84c] ml-1">◆</span>}
                </div>
                {isRevealed && (
                  <div
                    className="text-[9px] uppercase tracking-wider font-bold"
                    style={{
                      color: player.role === 'mafia' ? '#c0392b' : player.role === 'detective' ? '#4a90d9' : player.role === 'doctor' ? '#43e17a' : '#7a7d8a',
                    }}
                  >
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
                  className="text-[10px] text-[#e8a84c] hover:text-[#e8a84c]/80 px-1"
                  title="Whisper"
                >
                  ✉
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-[#353535]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={revealAllRoles}
            onChange={() => {}}
            className="w-3 h-3 accent-[#e8a84c]"
          />
          <span className="text-[10px] text-[#7a7d8a] uppercase tracking-wider">Reveal Roles</span>
        </label>
      </div>
    </div>
  );
}