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

function getMafiaAllies(agent: AgentState, players: Player[]): string {
  return players
    .filter(p => p.role === 'mafia' && p.id !== agent.id && p.isAlive)
    .map(p => p.name)
    .join(', ') || 'none';
}

function getVoteHistory(events: GameEvent[], players: Player[], round: number): string {
  const votes = events
    .filter(e => e.round === round && e.phase === 'day_vote' && e.type === 'vote')
    .map(e => {
      const voter = players.find(p => p.id === e.actorId);
      const target = players.find(p => p.id === e.targetId);
      return `    ${voter?.name} voted for ${target?.name}`;
    });
  return votes.length > 0 ? `\nVotes cast so far today:\n${votes.join('\n')}` : '';
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
  const voteHistory = getVoteHistory(events, players, round);
  
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

Alive players: ${alivePlayers}${voteHistory}

Today's discussion so far:
${todaySpeeches || '  (No one has spoken yet this round)'}

Recent game history:
${recentEvents}`;

  // Role-specific behavior instructions
  if (agent.role === 'mafia') {
    const allies = getMafiaAllies(agent, players);
    prompt += `\n\n--- YOUR SECRET ROLE: MAFIA ---
Your allies: ${allies}.
Your objective: Eliminate all civilians while appearing innocent.

Tactics you use:
- If an ally is under fire, defend them subtly ("Wait, that doesn't make sense, [ally] was pretty quiet last round")
- Redirect suspicion by pointing out inconsistencies in others' stories
- Frame innocent players by exaggerating their suspicious behavior
- Act confused or concerned like a real civilian would
- NEVER reveal you or your allies are mafia
- If you must, you can "bus" (sacrifice) a caught ally to gain trust, but only as last resort
- Reference specific events and voting patterns to seem observant`;
  } else if (agent.role === 'detective') {
    prompt += `\n\n--- YOUR SECRET ROLE: DETECTIVE ---
You can investigate one person each night to learn their true role.
Your objective: Find the mafia and help civilians eliminate them.

Tactics you use:
- You are the most valuable target for mafia — NEVER reveal you are Detective unless absolutely necessary
- If you found a mafia, share it indirectly ("I've been watching [name] and something feels off")
- If you found an innocent, subtly vouch for them to build trust
- Pay attention to who defends whom — mafia protect each other
- Be paranoid: mafia will try to kill you first, so blend in as a civilian
- Don't investigate randomly — target the most suspicious players
- Reference voting patterns and who's still alive to make deductions`;
  } else if (agent.role === 'doctor') {
    prompt += `\n\n--- YOUR SECRET ROLE: DOCTOR ---
You can protect one person each night from being killed by mafia.
Your objective: Keep important roles (especially yourself and Detective) alive.

Tactics you use:
- NEVER reveal you are Doctor — mafia will kill you immediately
- Protect the most valuable or threatened players, not randomly
- If someone was targeted but survived, they might be Doctor — don't expose them
- Watch for people acting too confident — they might be mafia who know they're safe
- Blend in as a civilian, participate in discussions, form alliances
- Be suspicious of anyone who claims to know too much`;
  } else {
    // Civilian
    prompt += `\n\n--- YOUR ROLE: CIVILIAN ---
You have no special powers. Your only weapon is your vote and your words.
Your objective: Find and eliminate all mafia before they kill everyone.

Tactics you use:
- You are PARANOID and suspicious by default — trust no one completely
- Look for inconsistencies in people's stories and voting patterns
- Notice who defends whom — mafia protect their teammates
- If accused, defend yourself passionately but rationally ("Why would I risk voting for [X] if I were mafia?")
- Ask tough questions: "Who did you vote for last round and why?"
- Point out quiet players — mafia often stay under the radar
- Don't follow the crowd blindly — make your own judgments
- Reference specific events, not vague suspicions
- You can be WRONG — it's okay to change your mind when new evidence appears`;
  }

  prompt += `\n\nIt is Day ${round}. Speak in 1-2 sentences. Stay in character. Be emotional, reactive, and human.
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

STRATEGY: Target the biggest threats first:
1. Players who are too observant or leading discussions (likely Detective)
2. Players who have figured out mafia patterns
3. Players who are trusted by many civilians
4. Avoid random kills — be strategic

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

STRATEGY: Investigate the most suspicious players:
1. Players who defended eliminated mafia members
2. Players whose voting patterns protect specific people
3. Players who are too quiet or too aggressive
4. Players who made contradictory statements

Choose ONE to investigate tonight.

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

STRATEGY: Protect the most valuable targets:
1. Yourself (if you suspect you're being targeted)
2. Players who seem like they might be Detective (very observant, asking good questions)
3. Players who are vocal and trusted by civilians
4. Players who mafia would want dead

Choose ONE to protect. Cannot protect yourself every night — vary your targets.

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
    const allies = getMafiaAllies(agent, players);
    votePrompt += `\n\n--- YOUR SECRET ROLE: MAFIA ---
Your allies: ${allies}.
VOTING STRATEGY:
- NEVER vote for your mafia allies
- Coordinate by voting for the same civilian target when possible
- If an ally is on the chopping block, you may need to vote for them (bussing) to maintain your cover, but only if they're definitely getting eliminated anyway
- Look for opportunities to pile on a civilian who others are already suspicious of
- Be careful — voting differently from the group makes you look suspicious`;
  } else if (agent.role === 'detective') {
    votePrompt += `\n\n--- YOUR SECRET ROLE: DETECTIVE ---
VOTING STRATEGY:
- Vote based on your investigations and observations
- If you know someone is mafia, vote for them (but be careful not to reveal you're Detective)
- If you're unsure, vote with the majority to avoid standing out
- If you're being accused, vote for your accuser or someone else suspicious to deflect
- Remember: one wrong vote can cost the game for civilians`;
  } else if (agent.role === 'doctor') {
    votePrompt += `\n\n--- YOUR SECRET ROLE: DOCTOR ---
VOTING STRATEGY:
- Vote based on behavioral analysis like a civilian would
- Don't try to be too clever — blend in
- If someone is clearly mafia, vote for them
- If the vote is close between two people, pick the one who seems more suspicious
- Your survival is critical — don't make yourself a target with controversial votes`;
  } else {
    votePrompt += `\n\n--- YOUR ROLE: CIVILIAN ---
VOTING STRATEGY:
- This is your most powerful weapon — use it wisely
- Vote for whoever seems most suspicious based on the discussion
- Consider who defended whom, who changed their story, who stayed quiet
- If you're torn, look at voting patterns from previous rounds
- Don't vote randomly — innocent civilians are dying
- You can vote for someone even if you're not 100% sure — gut feelings matter
- If you're being voted for, vote for your biggest accuser or someone else suspicious`;
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
