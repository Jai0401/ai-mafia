// src/components/GameMap/Character.tsx
import { motion } from 'framer-motion';
import type { Player, HatType } from '../../types/game';

interface Props {
  player: Player;
  isRevealed: boolean;
  isSpeaking: boolean;
  isThinking?: boolean;
  onClick?: () => void;
}

function getHatSVG(hat: HatType, _color: string): React.ReactNode {
  switch (hat) {
    case 'duck':
      return (
        <g transform="translate(14, -18)">
          <ellipse cx="16" cy="10" rx="14" ry="9" fill="#f1c40f" />
          <ellipse cx="16" cy="8" rx="10" ry="6" fill="#f39c12" />
          <circle cx="26" cy="8" r="4" fill="#fff" />
          <circle cx="27" cy="8" r="1.5" fill="#000" />
          <path d="M28 6 L36 4 L30 10 Z" fill="#e67e22" />
        </g>
      );
    case 'tophat':
      return (
        <g transform="translate(14, -22)">
          <rect x="4" y="16" width="24" height="4" rx="1" fill="#2c3e50" />
          <rect x="8" y="0" width="16" height="16" rx="1" fill="#2c3e50" />
          <rect x="8" y="14" width="16" height="2" fill="#e8a84c" />
        </g>
      );
    case 'bowler':
      return (
        <g transform="translate(14, -14)">
          <ellipse cx="16" cy="10" rx="16" ry="8" fill="#5d4037" />
          <rect x="6" y="6" width="20" height="6" rx="2" fill="#4e342e" />
        </g>
      );
    case 'beret':
      return (
        <g transform="translate(14, -16)">
          <ellipse cx="16" cy="10" rx="14" ry="7" fill="#c0392b" />
          <rect x="4" y="8" width="24" height="4" rx="1" fill="#a93226" />
          <circle cx="8" cy="10" r="2" fill="#a93226" />
        </g>
      );
    case 'crown':
      return (
        <g transform="translate(14, -18)">
          <path d="M4 14 L4 4 L10 10 L16 2 L22 10 L28 4 L28 14 Z" fill="#f1c40f" stroke="#d4ac0d" strokeWidth="1" />
          <circle cx="10" cy="8" r="2" fill="#e74c3c" />
          <circle cx="16" cy="5" r="2.5" fill="#3498db" />
          <circle cx="22" cy="8" r="2" fill="#e74c3c" />
        </g>
      );
    case 'cap':
      return (
        <g transform="translate(14, -14)">
          <path d="M4 10 Q16 2 28 10 L28 12 Q16 6 4 12 Z" fill="#3498db" />
          <rect x="24" y="10" width="10" height="3" rx="1" fill="#2980b9" />
        </g>
      );
  }
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
            className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-bg-deep px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap z-50 shadow-lg"
            style={{ minWidth: '80px', textAlign: 'center' }}
          >
            💬
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
          </motion.div>
        )}

        {/* Thinking indicator */}
        {isThinking && !isDead && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 z-50"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              className="w-2 h-2 rounded-full bg-accent-amber"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
              className="w-2 h-2 rounded-full bg-accent-amber"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
              className="w-2 h-2 rounded-full bg-accent-amber"
            />
          </motion.div>
        )}

        {/* Character SVG - Among Us style */}
        <div
          className="relative"
          style={{
            opacity: isDead ? 0.35 : 1,
            filter: isDead ? 'grayscale(80%) blur(0.3px)' : 'none',
          }}
        >
          {/* Mafia glow */}
          {(isRevealed && isMafia && !isDead) && (
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                backgroundColor: 'rgba(192, 57, 43, 0.5)',
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
              className="absolute inset-0 rounded-full blur-lg"
              style={{
                backgroundColor: player.color,
                transform: 'scale(1.8)',
                zIndex: -1,
              }}
            />
          )}

          <svg width="64" height="72" viewBox="0 0 64 72">
            {/* Shadow */}
            <ellipse cx="32" cy="68" rx="20" ry="4" fill="rgba(0,0,0,0.3)" />
            
            {/* Backpack */}
            <rect x="8" y="24" width="10" height="28" rx="4" fill={player.color} opacity={isDead ? 0.5 : 0.9} />
            
            {/* Body (bean shape) */}
            <rect x="16" y="16" width="32" height="44" rx="16" fill={player.color} opacity={isDead ? 0.5 : 1} />
            
            {/* Visor */}
            <rect x="24" y="22" width="22" height="14" rx="7" fill={isDead ? '#0a0a14' : '#1a1a2e'} />
            <rect x="26" y="24" width="18" height="10" rx="5" fill={isDead ? '#070712' : '#16213e'} />
            <ellipse cx="40" cy="28" rx="3" ry="2" fill={isDead ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'} />
            
            {/* Legs */}
            <rect x="22" y="54" width="10" height="12" rx="4" fill={player.color} opacity={isDead ? 0.5 : 1} />
            <rect x="34" y="54" width="10" height="12" rx="4" fill={player.color} opacity={isDead ? 0.5 : 1} />
            
            {/* Hat */}
            {getHatSVG(player.hat, player.color)}
          </svg>
        </div>

        {/* Name badge */}
        <span
          className="text-xs font-display mt-1 whitespace-nowrap px-2 py-0.5 rounded-full bg-bg-deep/80"
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
