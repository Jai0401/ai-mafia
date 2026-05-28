// src/components/GameMap/Room.tsx
import type { RoomLayout } from '../../types/game';

interface Props {
  room: RoomLayout;
  isLit: boolean;
  children?: React.ReactNode;
}

export default function Room({ room, isLit, children }: Props) {
  // Atmospheric gradients per room — day (lit) vs night (dark)
  const getAtmosphere = () => {
    switch (room.id) {
      case 'library':
        return isLit
          ? {
              bg: 'radial-gradient(ellipse at 30% 20%, #2a3a5c 0%, #1a2744 50%, #0f1a2e 100%)',
              floor: 'linear-gradient(to bottom, transparent 60%, #162238 100%)',
              vignette: 'rgba(10, 20, 40, 0.2)',
              svgOpacity: 0.35,
            }
          : {
              bg: 'radial-gradient(ellipse at 30% 20%, #1a2744 0%, #0d1117 60%, #070a10 100%)',
              floor: 'linear-gradient(to bottom, transparent 60%, #0a1628 100%)',
              vignette: 'rgba(10, 20, 40, 0.5)',
              svgOpacity: 0.2,
            };
      case 'dining':
        return isLit
          ? {
              bg: 'radial-gradient(ellipse at 50% 30%, #4a4035 0%, #3a3228 50%, #2a2520 100%)',
              floor: 'linear-gradient(to bottom, transparent 55%, #322a20 100%)',
              vignette: 'rgba(30, 20, 10, 0.15)',
              svgOpacity: 0.35,
            }
          : {
              bg: 'radial-gradient(ellipse at 50% 30%, #2a2520 0%, #1a1714 50%, #0f0d0b 100%)',
              floor: 'linear-gradient(to bottom, transparent 55%, #1a1510 100%)',
              vignette: 'rgba(30, 20, 10, 0.3)',
              svgOpacity: 0.2,
            };
      case 'parlour':
        return isLit
          ? {
              bg: 'radial-gradient(ellipse at 50% 40%, #4a3030 0%, #3a2020 50%, #2a1818 100%)',
              floor: 'linear-gradient(to bottom, transparent 55%, #322020 100%)',
              vignette: 'rgba(40, 10, 10, 0.2)',
              svgOpacity: 0.35,
            }
          : {
              bg: 'radial-gradient(ellipse at 50% 40%, #2a1818 0%, #1a0f0f 50%, #0f0808 100%)',
              floor: 'linear-gradient(to bottom, transparent 55%, #1a0f0f 100%)',
              vignette: 'rgba(40, 10, 10, 0.4)',
              svgOpacity: 0.2,
            };
      default:
        return {
          bg: isLit ? '#1a1f2e' : '#0d1117',
          floor: 'none',
          vignette: 'rgba(0,0,0,0.5)',
          svgOpacity: 0.2,
        };
    }
  };

  const atmosphere = getAtmosphere();

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background atmosphere */}
      <div
        className="absolute inset-0 transition-all duration-[2000ms]"
        style={{ background: atmosphere.bg }}
      />

      {/* Floor */}
      <div
        className="absolute inset-0 transition-all duration-[2000ms]"
        style={{ background: atmosphere.floor }}
      />

      {/* Room-specific props / furniture silhouettes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-[2000ms]"
        style={{ opacity: atmosphere.svgOpacity }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {room.id === 'library' && (
          <>
            {/* Bookshelves on left */}
            <rect x="2" y="10" width="8" height="70" rx="0.5" fill={room.color} opacity="0.3" />
            <rect x="2" y="15" width="8" height="1" fill={room.color} opacity="0.5" />
            <rect x="2" y="30" width="8" height="1" fill={room.color} opacity="0.5" />
            <rect x="2" y="45" width="8" height="1" fill={room.color} opacity="0.5" />
            <rect x="2" y="60" width="8" height="1" fill={room.color} opacity="0.5" />
            {/* Bookshelves on right */}
            <rect x="90" y="10" width="8" height="70" rx="0.5" fill={room.color} opacity="0.3" />
            <rect x="90" y="20" width="8" height="1" fill={room.color} opacity="0.5" />
            <rect x="90" y="35" width="8" height="1" fill={room.color} opacity="0.5" />
            <rect x="90" y="50" width="8" height="1" fill={room.color} opacity="0.5" />
            {/* Moon window */}
            <circle cx="50" cy="12" r="6" fill="#e8e8e8" opacity="0.1" />
            <rect x="44" y="6" width="12" height="12" rx="6" fill="none" stroke={room.color} strokeWidth="0.3" opacity="0.3" />
            {/* Reading table */}
            <ellipse cx="50" cy="72" rx="20" ry="4" fill={room.color} opacity="0.15" />
            <rect x="30" y="72" width="40" height="8" rx="2" fill={room.color} opacity="0.1" />
          </>
        )}
        {room.id === 'dining' && (
          <>
            {/* Long dining table */}
            <ellipse cx="50" cy="55" rx="35" ry="6" fill={room.color} opacity="0.15" />
            <rect x="15" y="55" width="70" height="10" rx="3" fill={room.color} opacity="0.1" />
            {/* Table legs */}
            <rect x="25" y="62" width="3" height="15" rx="0.5" fill={room.color} opacity="0.2" />
            <rect x="72" y="62" width="3" height="15" rx="0.5" fill={room.color} opacity="0.2" />
            {/* Chandelier */}
            <line x1="50" y1="0" x2="50" y2="12" stroke={room.color} strokeWidth="0.3" opacity="0.4" />
            <circle cx="50" cy="14" r="4" fill={room.color} opacity="0.2" />
            <circle cx="45" cy="17" r="2" fill={room.color} opacity="0.15" />
            <circle cx="55" cy="17" r="2" fill={room.color} opacity="0.15" />
            {/* Wall sconces */}
            <circle cx="10" cy="25" r="2" fill="#f1c40f" opacity="0.15" />
            <circle cx="90" cy="25" r="2" fill="#f1c40f" opacity="0.15" />
          </>
        )}
        {room.id === 'parlour' && (
          <>
            {/* Voting booth / podium */}
            <rect x="42" y="25" width="16" height="20" rx="2" fill={room.color} opacity="0.12" />
            <rect x="44" y="28" width="12" height="12" rx="1" fill={room.color} opacity="0.08" />
            {/* Curtain drapes on sides */}
            <path d="M0,0 Q8,25 0,50" fill={room.color} opacity="0.1" />
            <path d="M100,0 Q92,25 100,50" fill={room.color} opacity="0.1" />
            {/* Judgment scale */}
            <line x1="50" y1="5" x2="50" y2="15" stroke={room.color} strokeWidth="0.4" opacity="0.3" />
            <line x1="42" y1="10" x2="58" y2="10" stroke={room.color} strokeWidth="0.4" opacity="0.3" />
            <circle cx="42" cy="13" r="3" fill={room.color} opacity="0.15" />
            <circle cx="58" cy="13" r="3" fill={room.color} opacity="0.15" />
          </>
        )}
      </svg>

      {/* Vignette overlay — only during night (not lit) */}
      {!isLit && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-[2000ms]"
          style={{
            boxShadow: `inset 0 0 150px 60px ${atmosphere.vignette}`,
          }}
        />
      )}

      {/* Dust particles / atmosphere */}
      {isLit && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/10 animate-pulse"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${3 + i}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Characters container */}
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
