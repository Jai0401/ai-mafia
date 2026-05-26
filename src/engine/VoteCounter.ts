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

  const maxVotes = Math.max(...Object.values(voteCounts), 0);
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

  // Tie: no one is eliminated (standard mafia rules)
  if (tiedPlayers.length > 1) {
    events.push({
      round,
      phase: 'day_vote',
      type: 'system',
      actorId: 'system',
      content: `The vote was tied between ${tiedPlayers.map(id => players.find(p => p.id === id)?.name).join(' and ')}! No one was eliminated.`,
      timestamp: Date.now(),
      isPublic: true,
    });
  } else {
    // No votes cast
    events.push({
      round,
      phase: 'day_vote',
      type: 'system',
      actorId: 'system',
      content: 'No votes were cast. No one was eliminated.',
      timestamp: Date.now(),
      isPublic: true,
    });
  }

  return { events };
}
