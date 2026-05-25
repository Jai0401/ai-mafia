// src/engine/VoteCounter.ts
import type {  GameEvent, Player  } from "../types/game";

export interface VoteResult {
  eliminatedPlayerId?: string;
  events: GameEvent[];
}

export function countVotes(
  votes: Record<string, string>,
  players: Player[],
  round: number,
): VoteResult {
  const voteCounts: Record<string, number> = {};

  Object.entries(votes).forEach(([, targetId]) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const maxVotes = Math.max(...Object.values(voteCounts));
  const tiedPlayers = Object.entries(voteCounts)
    .filter(([, count]) => count === maxVotes)
    .map(([id]) => id);

  const events: GameEvent[] = [];

  // Log all votes
  Object.entries(votes).forEach(([voterId, targetId]) => {
    const voter = players.find((p) => p.id === voterId);
    const target = players.find((p) => p.id === targetId);
    events.push({
      round,
      phase: 'day_vote',
      type: 'vote',
      actorId: voterId,
      targetId,
      content: `${voter?.name} voted for ${target?.name}.`,
      timestamp: Date.now(),
      isPublic: true,
    });
  });

  if (tiedPlayers.length === 1) {
    const eliminatedId = tiedPlayers[0];
    const eliminated = players.find((p) => p.id === eliminatedId);
    events.push({
      round,
      phase: 'day_vote',
      type: 'elimination',
      actorId: 'system',
      targetId: eliminatedId,
      content: `${eliminated?.name} was eliminated by vote. They were a ${eliminated?.role}.`,
      timestamp: Date.now(),
      isPublic: true,
    });
    return { eliminatedPlayerId: eliminatedId, events };
  }

  // Tie: random elimination from tied players
  const eliminatedId = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
  const eliminated = players.find((p) => p.id === eliminatedId);
  events.push({
    round,
    phase: 'day_vote',
    type: 'elimination',
    actorId: 'system',
    targetId: eliminatedId,
    content: `The vote was tied! ${eliminated?.name} was randomly eliminated. They were a ${eliminated?.role}.`,
    timestamp: Date.now(),
    isPublic: true,
  });

  return { eliminatedPlayerId: eliminatedId, events };
}
