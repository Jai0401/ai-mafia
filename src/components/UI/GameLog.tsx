// src/components/UI/GameLog.tsx
import { useRef, useEffect } from 'react';
import type { GameEvent, Player } from '../../types/game';

interface Props {
  events: GameEvent[];
  players: Player[];
}

export default function GameLog({ events, players }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getPlayerName = (playerId: string): string => {
    if (playerId === 'system' || playerId === 'director') return playerId;
    const player = players.find(p => p.id === playerId);
    return player?.name || playerId;
  };

  const getEventColor = (type: string, isPublic: boolean): string => {
    if (!isPublic) return 'text-text-muted/40 italic';
    switch (type) {
      case 'speech': return 'text-text-primary';
      case 'vote': return 'text-accent-amber';
      case 'elimination': return 'text-accent-red';
      case 'investigation': return 'text-accent-blue';
      case 'protection': return 'text-green-400';
      case 'system': return 'text-text-muted';
      default: return 'text-text-muted';
    }
  };

  const getEventPrefix = (event: GameEvent): string => {
    if (!event.isPublic) return '🔒';
    switch (event.type) {
      case 'speech': return '🗣️';
      case 'vote': return '🗳️';
      case 'elimination': return '💀';
      case 'investigation': return '🔍';
      case 'protection': return '🛡️';
      case 'system': return '📢';
      default: return '•';
    }
  };

  // Filter to only show public events and system announcements
  const visibleEvents = events.filter(event => event.isPublic || event.type === 'system' || event.type === 'elimination');

  return (
    <div className="bg-bg-room rounded-lg border border-text-muted/20 p-4 h-48 flex flex-col">
      <h3 className="font-display text-xs text-accent-amber uppercase tracking-wider mb-2 flex-shrink-0">
        Game Log
      </h3>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5"
      >
        {visibleEvents.map((event, index) => (
          <div key={index} className={`${getEventColor(event.type, event.isPublic)} leading-relaxed`}>
            <span className="text-text-muted/40">[{event.round}]</span>{' '}
            <span className="mr-1">{getEventPrefix(event)}</span>
            {event.type === 'speech' && (
              <span className="font-bold text-accent-amber">{getPlayerName(event.actorId)}: </span>
            )}
            {event.type === 'vote' && (
              <span className="font-bold text-accent-amber">{getPlayerName(event.actorId)} </span>
            )}
            {event.content}
          </div>
        ))}
        {visibleEvents.length === 0 && (
          <div className="text-text-muted/50 italic">No events yet...</div>
        )}
      </div>
    </div>
  );
}
