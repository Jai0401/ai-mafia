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
    <div className="flex items-center justify-between px-4 py-2 bg-[#1b1b1b] border-b-2 border-[#353535] font-pixel">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: isNight ? 0 : 180 }}
          transition={{ duration: 1.5 }}
          className="text-xl"
        >
          {isNight ? '☾' : '☀'}
        </motion.div>
        <div>
          <h2 className="text-sm font-bold text-[#e2e2e2] uppercase tracking-wider">
            {isNight ? 'Night' : 'Day'}
          </h2>
          <p className="text-[#7a7d8a] text-[10px] uppercase tracking-widest">Round {round}</p>
        </div>
      </div>

      <div className="text-[#7a7d8a] text-[11px]">
        {phase === 'night' && 'The town sleeps uneasily...'}
        {phase === 'day_discussion' && 'Discussion phase'}
        {phase === 'day_vote' && 'Voting phase'}
        {phase === 'game_over' && 'Game Over'}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s as 1 | 2 | 4)}
              className={`px-2 py-1 text-[10px] font-bold transition-colors border ${
                speed === s
                  ? 'bg-[#e8a84c] text-[#131313] border-[#e8a84c]'
                  : 'bg-[#131313] text-[#7a7d8a] border-[#353535] hover:text-[#e2e2e2]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={onPauseToggle}
          className="px-3 py-1 text-xs bg-[#131313] border border-[#353535] text-[#e2e2e2] hover:border-[#555] transition-colors"
        >
          {isPaused ? '▶' : '⏸'}
        </button>
      </div>
    </div>
  );
}