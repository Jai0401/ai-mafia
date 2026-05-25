// src/components/GameMap/SpeechBubble.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameEvent } from '../../types/game';

interface Props {
  events: GameEvent[];
  players: { id: string; name: string; color: string }[];
}

export default function SpeechBubble({ events, players }: Props) {
  const [visibleSpeeches, setVisibleSpeeches] = useState<GameEvent[]>([]);

  useEffect(() => {
    const speechEvents = events.filter((e) => e.type === 'speech').slice(-3);
    setVisibleSpeeches(speechEvents);

    const timers = speechEvents.map(() =>
      setTimeout(() => {
        setVisibleSpeeches((prev) => prev.slice(1));
      }, 4000),
    );

    return () => timers.forEach(clearTimeout);
  }, [events]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {visibleSpeeches.map((event, index) => {
          const speaker = players.find((p) => p.id === event.actorId);
          if (!speaker) return null;

          return (
            <motion.div
              key={event.timestamp}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute bg-bg-room-lit border border-text-muted/30 rounded-lg px-4 py-2 max-w-[200px] shadow-lg"
              style={{
                left: `${20 + index * 25}%`,
                top: `${10 + index * 15}%`,
              }}
            >
              <div
                className="text-xs font-semibold mb-1"
                style={{ color: speaker.color }}
              >
                {speaker.name}
              </div>
              <p className="text-sm text-text-primary font-body leading-snug">
                {event.content}
              </p>
              <div
                className="absolute -bottom-2 left-4 w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '8px solid #1e2333',
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
