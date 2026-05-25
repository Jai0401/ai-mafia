// src/hooks/useGameLoop.ts
import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export function useGameLoop() {
  const { state, dispatch } = useGame();
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = () => {
      // Smoothly interpolate player positions toward target positions
      state.players.forEach((player) => {
        const dx = player.targetPosition.x - player.position.x;
        const dy = player.targetPosition.y - player.position.y;
        
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          dispatch({
            type: 'UPDATE_PLAYER_POSITION',
            payload: {
              playerId: player.id,
              position: {
                x: player.position.x + dx * 0.05,
                y: player.position.y + dy * 0.05,
              },
            },
          });
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.players, dispatch]);
}
