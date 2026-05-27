// src/components/GameMap/Character.tsx
import { motion } from 'framer-motion';
import type { Player } from '../../types/game';

interface Props {
  player: Player;
  isRevealed: boolean;
  isSpeaking: boolean;
  isThinking?: boolean;
  onClick?: () => void;
}

export default function Character({ player, isRevealed, isSpeaking, isThinking, onClick }: Props) {
  const isDead = !player.isAlive;
  const isMafia = player.role === 'mafia';

  return (
    <motion.div
      className={`absolute cursor-pointer ${isDead ? 'z-10' : 'z-30'}`}
      style={{
        left: `${player.position.x}%`,
        top: `${player.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      animate={{
        left: `${player.targetPosition.x}%`,
        top: `${player.targetPosition.y}%`,
      }}
      transition={{
        duration: 1.2,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      onClick={onClick}
    >
      <div className="flex flex-col items-center relative">
        {/* Ghost effect for dead players */}
        {isDead && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-full blur-xl"
            style={{
              background: `radial-gradient(circle, ${player.color}30 0%, transparent 70%)`,
              zIndex: -1,
            }}
          />
        )}

        {/* Speech bubble above character */}
        {isSpeaking && !isDead && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 bg-[#1b1b1b] border-2 border-white px-3 py-2 text-xs font-bold whitespace-nowrap z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            style={{ minWidth: '80px', textAlign: 'center', fontFamily: 'Space Mono, monospace' }}
          >
            <span className="text-[#43e17a]">💬</span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
          </motion.div>
        )}

        {/* Thinking indicator */}
        {isThinking && !isDead && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 z-50"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              className="w-2 h-2 bg-[#e8a84c]"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
              className="w-2 h-2 bg-[#e8a84c]"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
              className="w-2 h-2 bg-[#e8a84c]"
            />
          </motion.div>
        )}

        {/* Character Sprite */}
        <div
          className="relative"
          style={{
            opacity: isDead ? 0.4 : 1,
            filter: isDead ? 'grayscale(100%) brightness(0.5)' : 'none',
          }}
        >
          {/* Mafia glow */}
          {(isRevealed && isMafia && !isDead) && (
            <div
              className="absolute inset-0 blur-xl"
              style={{
                backgroundColor: 'rgba(192, 57, 43, 0.4)',
                transform: 'scale(2)',
                zIndex: -1,
              }}
            />
          )}

          {/* Speaking glow */}
          {isSpeaking && !isDead && (
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 blur-lg"
              style={{
                backgroundColor: '#43e17a',
                transform: 'scale(1.8)',
                zIndex: -1,
              }}
            />
          )}

          {/* 8-bit character image */}
          <div className="w-16 h-20 relative">
            <img
              src={player.avatar}
              alt={player.name}
              className="w-full h-full object-contain pixelated"
              draggable={false}
            />
            {/* Role badge when revealed */}
            {isRevealed && !isDead && (
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider whitespace-nowrap border"
                style={{
                  backgroundColor: player.role === 'mafia' ? 'rgba(192,57,43,0.9)' : player.role === 'detective' ? 'rgba(74,144,217,0.9)' : player.role === 'doctor' ? 'rgba(46,204,113,0.9)' : 'rgba(122,125,138,0.9)',
                  borderColor: player.role === 'mafia' ? '#c0392b' : player.role === 'detective' ? '#4a90d9' : player.role === 'doctor' ? '#2ecc71' : '#7a7d8a',
                  color: '#fff',
                  fontFamily: 'Space Mono, monospace',
                }}
              >
                {player.role}
              </div>
            )}
          </div>
        </div>

        {/* Name badge */}
        <span
          className="text-xs font-pixel mt-1 whitespace-nowrap px-2 py-0.5 bg-[#131313]/80 border border-[#353535]"
          style={{
            color: player.color,
            textShadow: `0 0 6px ${player.color}80`,
            textDecoration: isDead ? 'line-through' : 'none',
            opacity: isDead ? 0.4 : 1,
          }}
        >
          {player.name}
        </span>
      </div>
    </motion.div>
  );
}