// src/components/UI/PhaseBar.tsx
import { motion } from 'framer-motion';
import type { Phase } from '../../types/game';

interface Props {
  phase: Phase;
  round: number;
  speed: 1 | 2 | 4;
  isPaused: boolean;
  onSpeedChange: (speed: 1 | 2 | 4) => void;
  onPauseToggle: () => void;
}

export default function PhaseBar({ phase, round, speed, isPaused, onSpeedChange, onPauseToggle }: Props) {
  const isNight = phase === 'night';

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-bg-room border-b-2 border-accent-amber/50">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: isNight ? 0 : 180 }}
          transition={{ duration: 1.5 }}
          className="text-2xl"
        >
          {isNight ? '🌙' : '☀️'}
        </motion.div>
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary">
            {isNight ? 'NIGHT' : 'DAY'}
          </h2>
          <p className="text-text-muted text-xs">Round {round}</p>
        </div>
      </div>

      <div className="text-text-muted text-sm font-body">
        {phase === 'night' && 'The town sleeps uneasily...'}
        {phase === 'day_discussion' && 'Discussion phase'}
        {phase === 'day_vote' && 'Voting phase'}
        {phase === 'game_over' && 'Game Over'}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s as 1 | 2 | 4)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                speed === s
                  ? 'bg-accent-amber text-bg-deep'
                  : 'bg-bg-deep text-text-muted hover:text-text-primary'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <button
          onClick={onPauseToggle}
          className="px-3 py-1 rounded text-sm bg-bg-deep text-text-primary hover:bg-bg-deep/80 transition-colors"
        >
          {isPaused ? '▶️' : '⏸️'}
        </button>
      </div>
    </div>
  );
}
