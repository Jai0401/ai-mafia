// src/components/GameMap/Room.tsx
import type { RoomLayout } from '../../types/game';

interface Props {
  room: RoomLayout;
  isLit: boolean;
  children?: React.ReactNode;
}

export default function Room({ room, isLit, children }: Props) {
  return (
    <div
      className="absolute rounded-lg border-2 overflow-hidden"
      style={{
        left: `${room.x}%`,
        top: `${room.y}%`,
        width: `${room.width}%`,
        height: `${room.height}%`,
        borderColor: isLit ? `${room.color}40` : '#2a2d3a',
        backgroundColor: isLit ? 'var(--color-bg-room-lit)' : 'var(--color-bg-room)',
        boxShadow: isLit
          ? `inset 0 0 40px ${room.color}10, 0 4px 20px rgba(0,0,0,0.4)`
          : 'inset 0 0 40px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.4)',
        transition: 'all 1.5s ease',
      }}
    >
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{room.icon}</span>
          <div>
            <h3
              className="font-display text-sm font-semibold uppercase tracking-wider"
              style={{ color: room.color }}
            >
              {room.name}
            </h3>
            <p className="text-text-muted text-xs">{room.description}</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div
          className="w-16 h-8 rounded-lg opacity-30"
          style={{
            backgroundColor: room.color,
            transform: 'skewX(-15deg)',
          }}
        />
      </div>

      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
