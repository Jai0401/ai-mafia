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
    if (!isPublic) return 'text-[#5b403b] italic';
    switch (type) {
      case 'speech': return 'text-[#e2e2e2]';
      case 'vote': return 'text-[#e8a84c]';
      case 'elimination': return 'text-[#c0392b]';
      case 'investigation': return 'text-[#4a90d9]';
      case 'protection': return 'text-[#43e17a]';
      case 'system': return 'text-[#7a7d8a]';
      default: return 'text-[#7a7d8a]';
    }
  };

  const getEventPrefix = (event: GameEvent): string => {
    if (!event.isPublic) return '🔒';
    switch (event.type) {
      case 'speech': return '▸';
      case 'vote': return '☐';
      case 'elimination': return '☠';
      case 'investigation': return '?';
      case 'protection': return '+';
      case 'system': return '!';
      default: return '•';
    }
  };

  const visibleEvents = events.filter(event => event.isPublic || event.type === 'system' || event.type === 'elimination');

  return (
    <div className="bg-[#1b1b1b] border border-[#353535] p-3 h-48 flex flex-col font-pixel">
      <h3 className="text-[10px] text-[#e8a84c] uppercase tracking-widest mb-2 flex-shrink-0 font-bold">
        Mission Log
      </h3>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto text-[10px] space-y-1 leading-relaxed"
      >
        {visibleEvents.map((event, index) => (
          <div key={index} className={`${getEventColor(event.type, event.isPublic)}`}>
            <span className="text-[#5b403b]">[{event.round}]</span>{' '}
            <span className="mr-1">{getEventPrefix(event)}</span>
            {event.type === 'speech' && (
              <span className="font-bold text-[#e8a84c]">{getPlayerName(event.actorId)}: </span>
            )}
            {event.type === 'vote' && (
              <span className="font-bold text-[#e8a84c]">{getPlayerName(event.actorId)} </span>
            )}
            {event.content}
          </div>
        ))}
        {visibleEvents.length === 0 && (
          <div className="text-[#5b403b] italic">No events yet...</div>
        )}
      </div>
    </div>
  );
}