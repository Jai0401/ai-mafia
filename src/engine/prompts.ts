// src/engine/prompts.ts
import type { AgentState, GameEvent, Player, AgentBeliefs, Role } from "../types/game";

function formatBeliefs(beliefs: AgentBeliefs, players: Player[]): string {
  const entries = Object.entries(beliefs.players)
    .map(([id, entry]) => {
      const player = players.find(p => p.id === id);
      if (!player) return '';
      return `  ${player.name}: suspicion ${(entry.suspicion * 100).toFixed(0)}%, suspected ${entry.suspectedRole}. Reason: "${entry.reason}"`;
    })
    .filter(Boolean)
    .join('\n');

  const deductions = beliefs.deductions.length > 0
    ? `Your deductions:\n${beliefs.deductions.map((d, i) => `  ${i + 1}. ${d}`).join('\n')}`
    : 'Your deductions: None yet.';

  const strategy = beliefs.strategy
    ? `Your current strategy: "${beliefs.strategy}"`
    : 'Your current strategy: Observe and gather information.';

  const relationships = [
    beliefs.relationships.allies.length > 0 ? `  Allies: ${beliefs.relationships.allies.map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(', ')}` : '',
    beliefs.relationships.enemies.length > 0 ? `  Enemies: ${beliefs.relationships.enemies.map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(', ')}` : '',
  ].filter(Boolean).join('\n');

  return `Your beliefs about players:\n${entries || '  No strong beliefs yet.'}\n\n${deductions}\n\n${strategy}${relationships ? '\n\nYour relationships:\n' + relationships : ''}`;
}

function formatKnownRoles(knownRoles: Record<string, Role>, _players: Player[]): string {
  const entries = Object.entries(knownRoles)
    .map(([name, role]) => `  ${name}: ${role}`)
    .join('\n');
  return entries ? `Known roles (from eliminations/investigations):\n${entries}` : 'Known roles: None confirmed yet.';
}

function formatAlivePlayers(players: Player[], excludeId?: string): string {
  return players
    .filter(p => p.isAlive && p.id !== excludeId)
    .map(p => p.name)
    .join(', ');
}

export function buildDiscussionPrompt(
  agent: AgentState,
  round: number,
  events: GameEvent[],
  players: Player[],
  whisper?: string,
): string {
  const beliefsText = formatBeliefs(agent.beliefs, players);
  const knownRolesText = formatKnownRoles(agent.knownRoles, players);
  const alivePlayers = formatAlivePlayers(players, agent.id);
  
  // Get today's speeches only
  const todaySpeeches = events
    .filter(e => e.round === round && e.phase === 'day_discussion' && e.type === 'speech')
    .map(e => {
      const speaker = players.find(p => p.id === e.actorId);
      return `  ${speaker?.name}: "${e.content}"`;
    })
    .join('\n');

  const visibleEvents = events.filter(e => e.isPublic || e.actorId === agent.id);
  const recentEvents = getRecentEvents(visibleEvents);

  let prompt = `You are ${agent.name}, a ${agent.role} in Mafia.
Personality: ${agent.personality.description}

${beliefsText}

${knownRolesText}

Alive players: ${alivePlayers}

Today's discussion so far:
${todaySpeeches || '  (No one has spoken yet this round)'}

Recent game history:
${recentEvents}`;

  if (agent.role === 'mafia') {
    const mafiaAllies = players.filter(p => p.role === 'mafia' && p.id !== agent.id && p.isAlive).map(p => p.name);
    prompt += `\n\nYou are MAFIA. Your secret allies: ${mafiaAllies.join(', ') || 'none'}.
Your objective: deceive civilians, deflect suspicion away from fellow mafia, and steer votes toward innocent players.
If an ally is under suspicion, defend them subtly or redirect attention to someone else.
Never reveal that you or your allies are mafia.`;
  }

  prompt += `\n\nIt is Day ${round}. Speak in 1-2 sentences. Stay in character. Reference specific players/events.

Respond with JSON: {"speech": "Your dialogue here"}`;

  if (whisper) {
    prompt += `\n\nA mysterious voice whispers: "${whisper}"\nConsider this in your response.`;
  }

  return prompt;
}

export function buildNightActionPrompt(
  agent: AgentState,
  action: 'mafia_kill' | 'detective_investigate' | 'doctor_protect',
  events: GameEvent[],
  players: Player[],
): string {
  const beliefsText = formatBeliefs(agent.beliefs, players);
  const knownRolesText = formatKnownRoles(agent.knownRoles, players);
  const visibleEvents = events.filter(e => e.isPublic || e.actorId === agent.id);
  const recentEvents = getRecentEvents(visibleEvents);
  
  if (action === 'mafia_kill') {
    const mafiaAlly = players.find(p => p.role === 'mafia' && p.id !== agent.id && p.isAlive);
    const nonMafiaTargets = players.filter(p => p.isAlive && p.role !== 'mafia' && p.id !== agent.id);
    const targetNames = nonMafiaTargets.map(p => p.name).join(', ');
    
    return `You are ${agent.name}, Mafia. Fellow Mafia: ${mafiaAlly?.name || 'none'}.

${beliefsText}

${knownRolesText}

Non-Mafia targets: ${targetNames}

Game history:
${recentEvents}

Choose ONE to eliminate. Cannot target fellow Mafia.

Respond with JSON: {"target": "player_name", "reasoning": "Why"}`;
  }

  if (action === 'detective_investigate') {
    const aliveNames = players.filter(p => p.isAlive && p.id !== agent.id).map(p => p.name).join(', ');
    return `You are ${agent.name}, Detective.

${beliefsText}

${knownRolesText}

Alive players: ${aliveNames}

Game history:
${recentEvents}

Choose ONE to investigate.

Respond with JSON: {"target": "player_name", "reasoning": "Why"}`;
  }

  // doctor_protect
  const aliveNames = players.filter(p => p.isAlive && p.id !== agent.id).map(p => p.name).join(', ');
  return `You are ${agent.name}, Doctor.

${beliefsText}

${knownRolesText}

Alive players: ${aliveNames}

Game history:
${recentEvents}

Choose ONE to protect. Cannot protect yourself.

Respond with JSON: {"target": "player_name", "reasoning": "Why"}`;
}

export function buildVotePrompt(
  agent: AgentState,
  events: GameEvent[],
  players: Player[],
): string {
  const beliefsText = formatBeliefs(agent.beliefs, players);
  const knownRolesText = formatKnownRoles(agent.knownRoles, players);
  const aliveOthers = formatAlivePlayers(players, agent.id);
  
  const todaySpeeches = events
    .filter(e => e.phase === 'day_discussion' && e.type === 'speech')
    .map(e => {
      const speaker = players.find(p => p.id === e.actorId);
      return `  ${speaker?.name}: "${e.content}"`;
    })
    .join('\n');

  const visibleEvents = events.filter(e => e.isPublic || e.actorId === agent.id);
  const recentEvents = getRecentEvents(visibleEvents);

  let votePrompt = `You are ${agent.name}. Time to vote.

${beliefsText}

${knownRolesText}

Today's discussion:
${todaySpeeches || 'No discussion today.'}

Game history:
${recentEvents}`;

  if (agent.role === 'mafia') {
    const mafiaAllies = players.filter(p => p.role === 'mafia' && p.id !== agent.id && p.isAlive).map(p => p.name);
    votePrompt += `\n\nYou are MAFIA. Your secret allies: ${mafiaAllies.join(', ') || 'none'}.
Do NOT vote for your allies. Coordinate with them by voting for the same civilian target to ensure mafia wins.`;
  }

  votePrompt += `\n\nAlive players you can vote for: ${aliveOthers}

Vote to eliminate one player, or abstain.

Respond with JSON:
{
  "vote": "player_name" or "abstain",
  "confidence": 0.0-1.0,
  "reasoning": "Why you're voting this way",
  "state_updates": {
    "players": {
      "player_name": { "suspicion": 0.0-1.0, "suspectedRole": "mafia|civilian|unknown", "reason": "Why" }
    }
  }
}`;

  return votePrompt;
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
