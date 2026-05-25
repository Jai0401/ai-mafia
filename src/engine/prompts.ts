// src/engine/prompts.ts
import type {  AgentState, GameEvent, Player  } from "../types/game";

export function buildDiscussionPrompt(
  agent: AgentState,
  round: number,
  events: GameEvent[],
  players: Player[],
  whisper?: string,
): string {
  const recentEvents = getRecentEvents(events);
  const suspicionText = Object.entries(agent.suspicions)
    .map(([id, score]) => {
      const player = players.find((p) => p.id === id);
      return player ? `${player.name}: ${(score * 100).toFixed(0)}%` : '';
    })
    .filter(Boolean)
    .join('\n');

  let prompt = `You are ${agent.name}, a ${agent.role} in a game of Mafia.
Your personality: ${agent.personality.description}
Your private suspicions:
${suspicionText || 'No strong suspicions yet.'}

Game history so far:
${recentEvents}

It is Day ${round} discussion phase.
Speak naturally in 1–3 sentences. Express suspicion, defend yourself, or redirect.
Do NOT reveal your role directly.
Stay in character. Be specific — reference actual in-game events.`;

  if (whisper) {
    prompt += `\n\nA mysterious voice whispers to you: "${whisper}"\nConsider this carefully in your response.`;
  }

  return prompt;
}

export function buildNightActionPrompt(
  agent: AgentState,
  action: 'mafia_kill' | 'detective_investigate' | 'doctor_protect',
  events: GameEvent[],
  players: Player[],
): string {
  const recentEvents = getRecentEvents(events);
  const alivePlayers = players.filter((p) => p.isAlive && p.id !== agent.id);
  const aliveNames = alivePlayers.map((p) => p.name).join(', ');

  if (action === 'mafia_kill') {
    const mafiaAlly = players.find(
      (p) => p.role === 'mafia' && p.id !== agent.id && p.isAlive,
    );
    return `You are ${agent.name}, a Mafia member. Your fellow Mafia: ${mafiaAlly?.name || 'none'}.
Alive players: ${aliveNames}
Game state:
${recentEvents}

Choose ONE player to eliminate tonight.
Respond with ONLY a JSON object: {"target": "player_name", "reasoning": "..."}`;
  }

  if (action === 'detective_investigate') {
    return `You are ${agent.name}, the Detective.
Alive players: ${aliveNames}
Game state:
${recentEvents}

Choose ONE player to investigate tonight. You will learn their true role.
Respond with ONLY a JSON object: {"target": "player_name", "reasoning": "..."}`;
  }

  return `You are ${agent.name}, the Doctor.
Alive players: ${aliveNames}
Game state:
${recentEvents}

Choose ONE player to protect tonight. If the Mafia targets them, they will survive.
Respond with ONLY a JSON object: {"target": "player_name", "reasoning": "..."}`;
}

export function buildVotePrompt(
  agent: AgentState,
  events: GameEvent[],
  players: Player[],
): string {
  const recentEvents = getRecentEvents(events);
  const todayEvents = events.filter(
    (e) => e.phase === 'day_discussion' && e.type === 'speech',
  );
  const suspicionText = Object.entries(agent.suspicions)
    .map(([id, score]) => {
      const player = players.find((p) => p.id === id);
      return player ? `${player.name}: ${(score * 100).toFixed(0)}%` : '';
    })
    .filter(Boolean)
    .join('\n');

  const speechesText = todayEvents
    .map((e) => {
      const speaker = players.find((p) => p.id === e.actorId);
      return `${speaker?.name || 'Unknown'}: "${e.content}"`;
    })
    .join('\n');

  return `You are ${agent.name}. Based on everything said today, vote to eliminate one player.
Your suspicion scores:
${suspicionText || 'No strong suspicions yet.'}

Recent statements:
${speechesText || 'No statements today.'}

Game state:
${recentEvents}

Respond with ONLY: {"vote": "player_name", "confidence": 0.0}`;
}

function getRecentEvents(events: GameEvent[]): string {
  const round1Events = events.filter((e) => e.round === 1);
  const recentEvents = events.slice(-20);
  const combined = [...new Set([...round1Events, ...recentEvents])];

  if (combined.length === 0) return 'This is the beginning of the game.';

  return combined
    .map((e) => {
      const typeLabels: Record<string, string> = {
        speech: 'said',
        vote: 'voted for',
        elimination: 'was eliminated',
        investigation: 'investigated',
        protection: 'protected',
        system: '[system]',
      };
      return `[Round ${e.round} ${e.phase}] ${typeLabels[e.type] || e.type}: ${e.content}`;
    })
    .join('\n');
}
