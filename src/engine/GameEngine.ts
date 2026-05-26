// src/engine/GameEngine.ts
import type { GameState, GameEvent, AgentState, Player, HumanMode, AgentBeliefs, BeliefEntry, AgentStateDiff } from "../types/game";
import { AgentRunner } from './AgentRunner';
import { resolveNightActions } from './ActionResolver';
import { countVotes } from './VoteCounter';
import { personalities } from '../data/personalities';
import { agentNames, characterColors, hatTypes } from '../data/names';
import { roomPositions } from '../data/roomLayout';

export class GameEngine {
  private dispatch: React.Dispatch<any>;
  private getState: () => GameState;
  private agentRunner: AgentRunner;
  private agents: Map<string, AgentState> = new Map();
  private isRunning = false;
  private whispers: Map<string, string> = new Map();

  constructor(dispatch: React.Dispatch<any>, getState: () => GameState, apiKey: string) {
    this.dispatch = dispatch;
    this.getState = getState;
    this.agentRunner = new AgentRunner(apiKey);
  }

  private createInitialBeliefs(players: Player[]): AgentBeliefs {
    const playerBeliefs: Record<string, BeliefEntry> = {};
    players.forEach(p => {
      playerBeliefs[p.id] = {
        suspicion: 0.5,
        reason: 'No information yet.',
        suspectedRole: 'unknown',
        lastUpdated: 1,
      };
    });
    return {
      players: playerBeliefs,
      deductions: [],
      strategy: 'Observe and gather information.',
      relationships: { allies: [], enemies: [] },
    };
  }

  private applyStateDiff(agent: AgentState, diff: AgentStateDiff | null, round: number, players: Player[]): void {
    if (!diff) return;
    
    // Apply player belief updates
    if (diff.playerBeliefs) {
      Object.entries(diff.playerBeliefs).forEach(([id, entry]) => {
        if (!agent.beliefs.players[id]) {
          agent.beliefs.players[id] = {
            suspicion: 0.5,
            reason: 'New observation.',
            suspectedRole: 'unknown',
            lastUpdated: round,
          };
        }
        if (typeof entry.suspicion === 'number') {
          agent.beliefs.players[id].suspicion = entry.suspicion;
        }
        if (entry.suspectedRole) {
          agent.beliefs.players[id].suspectedRole = entry.suspectedRole;
        }
        if (entry.reason) {
          agent.beliefs.players[id].reason = entry.reason;
        }
        agent.beliefs.players[id].lastUpdated = round;
      });
    }
    
    // Merge deductions (cap at 5, summarize if overflow)
    if (diff.beliefs?.deductions) {
      const newDeductions = [...agent.beliefs.deductions, ...diff.beliefs.deductions];
      if (newDeductions.length > 5) {
        // Keep last 3, summarize oldest 2 into 1
        const toSummarize = newDeductions.slice(0, newDeductions.length - 3);
        const summary = `Previous insights: ${toSummarize.map(d => d.substring(0, 30)).join('; ')}`;
        agent.beliefs.deductions = [summary, ...newDeductions.slice(-3)];
      } else {
        agent.beliefs.deductions = newDeductions;
      }
    }
    
    // Update strategy
    if (diff.beliefs?.strategy) {
      agent.beliefs.strategy = diff.beliefs.strategy;
    }
    
    // Update relationships
    if (diff.beliefs?.relationships) {
      const resolveNames = (names: string[]) => names
        .map(name => {
          const p = players.find(pl => pl.name.toLowerCase() === name.toLowerCase());
          return p?.id || name;
        })
        .filter(id => players.find(p => p.id === id));
      
      if (diff.beliefs.relationships.allies) {
        agent.beliefs.relationships.allies = resolveNames(diff.beliefs.relationships.allies);
      }
      if (diff.beliefs.relationships.enemies) {
        agent.beliefs.relationships.enemies = resolveNames(diff.beliefs.relationships.enemies);
      }
    }
  }

  private updateKnownRolesAfterElimination(eliminatedPlayer: Player): void {
    this.agents.forEach(agent => {
      agent.knownRoles[eliminatedPlayer.name] = eliminatedPlayer.role;
      // Update belief entry with actual role (detective/doctor are civilian team)
      if (agent.beliefs.players[eliminatedPlayer.id]) {
        const suspectedRole = eliminatedPlayer.role === 'mafia' ? 'mafia' : 'civilian';
        agent.beliefs.players[eliminatedPlayer.id].suspectedRole = suspectedRole;
        agent.beliefs.players[eliminatedPlayer.id].reason = `Revealed as ${eliminatedPlayer.role} upon elimination.`;
      }
    });
  }

  private persistAgents(): void {
    try {
      const data = Array.from(this.agents.entries()).map(([id, agent]) => [id, agent]);
      localStorage.setItem('ai-mafia-agent-states', JSON.stringify(data));
    } catch {
      // localStorage may be full
    }
  }

  initializeGame(humanMode?: HumanMode, humanRolePreference?: string): void {
    // Shuffle and pick 6 names, colors, hats, personalities
    const shuffledNames = this.shuffle([...agentNames]).slice(0, 6);
    const shuffledColors = this.shuffle([...characterColors]);
    const shuffledHats = this.shuffle([...hatTypes]);
    const shuffledPersonalities = this.shuffle([...personalities]);

    // Assign roles
    const roles: string[] = ['mafia', 'mafia', 'detective', 'doctor', 'civilian', 'civilian'];
    const shuffledRoles = this.shuffle(roles);

    // Create players
    const players: Player[] = shuffledNames.map((name, i) => ({
      id: `player-${i}`,
      name,
      role: shuffledRoles[i] as any,
      personality: shuffledPersonalities[i].name,
      isAlive: true,
      isHuman: false,
      color: shuffledColors[i],
      hat: shuffledHats[i],
      position: roomPositions['dining'][i % 3],
      targetPosition: roomPositions['dining'][i % 3],
    }));

    // Handle human player
    let humanPlayerId: string | undefined;
    if (humanMode === 'player') {
      const humanIndex = humanRolePreference && humanRolePreference !== 'random'
        ? shuffledRoles.findIndex((r) => r === humanRolePreference)
        : Math.floor(Math.random() * 6);
      
      const idx = humanIndex >= 0 ? humanIndex : Math.floor(Math.random() * 6);
      players[idx].isHuman = true;
      humanPlayerId = players[idx].id;
    }

    // Initialize agent states
    players.forEach((player) => {
      this.agents.set(player.id, {
        id: player.id,
        name: player.name,
        role: player.role,
        personality: shuffledPersonalities.find((p) => p.name === player.personality)!,
        beliefs: this.createInitialBeliefs(players),
        knownRoles: {},
        votingHistory: [],
        memory: [],
        suspicions: {},
        trust: {},
        privateNotes: '',
      });
    });

    this.dispatch({
      type: 'INIT_GAME',
      payload: { players, humanPlayerId, humanMode },
    });

    // Start the game loop after a short delay
    setTimeout(() => this.startNight(), 2000);
  }

  initializeGameWithPlayers(players: Player[], humanMode?: HumanMode, humanRolePreference?: string): void {
    // Handle human player assignment
    let humanPlayerId: string | undefined;
    if (humanMode === 'player') {
      const humanIndex = humanRolePreference
        ? players.findIndex((p) => p.role === humanRolePreference)
        : Math.floor(Math.random() * players.length);
      const idx = humanIndex >= 0 ? humanIndex : Math.floor(Math.random() * players.length);
      players[idx].isHuman = true;
      humanPlayerId = players[idx].id;
    }

    // Initialize agent states
    players.forEach((player) => {
      this.agents.set(player.id, {
        id: player.id,
        name: player.name,
        role: player.role,
        personality: personalities.find((p) => p.name === player.personality) || personalities[0],
        beliefs: this.createInitialBeliefs(players),
        knownRoles: {},
        votingHistory: [],
        memory: [],
        suspicions: {},
        trust: {},
        privateNotes: '',
      });
    });

    this.dispatch({
      type: 'INIT_GAME',
      payload: { players, humanPlayerId, humanMode },
    });

    setTimeout(() => this.startNight(), 2000);
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async startNight(): Promise<void> {
    this.isRunning = true;
    this.dispatch({ type: 'START_NIGHT' });

    // Move characters to library (night zone)
    this.moveCharactersToRoom('library');
    await this.delay(1200);

    const state = this.getState();

    // Get night actions from alive special roles
    // Execute night actions sequentially with delays to avoid 429 rate limits
    const aliveMafia = state.players.filter(p => p.isAlive && p.role === 'mafia');
    if (aliveMafia.length > 0) {
      // The first alive mafia is the "leader" who submits the kill
      const leaderMafia = aliveMafia[0];
      const agent = this.agents.get(leaderMafia.id);
      if (agent) {
        try {
          const nightAction = await this.agentRunner.getNightAction(agent, 'mafia_kill', state.events, state.players);
          this.applyStateDiff(agent, nightAction.stateUpdates, state.round, state.players);
          // Validate: mafia cannot kill other mafia
          const target = state.players.find(p => p.id === nightAction.targetId);
          const nonMafiaTargets = state.players.filter(p => p.isAlive && p.role !== 'mafia');
          if (target && target.role === 'mafia' && nonMafiaTargets.length > 0) {
            const randomTarget = nonMafiaTargets[Math.floor(Math.random() * nonMafiaTargets.length)];
            nightAction.targetId = randomTarget.id;
          }
          this.dispatch({ type: 'SUBMIT_NIGHT_ACTION', payload: nightAction });
        } catch (error) {
          console.error('Night action failed:', error);
        }
        await this.delay(600);
      }
    }

    // Detective
    const aliveDetective = state.players.find(p => p.isAlive && p.role === 'detective');
    if (aliveDetective) {
      const agent = this.agents.get(aliveDetective.id);
      if (agent) {
        try {
          const nightAction = await this.agentRunner.getNightAction(agent, 'detective_investigate', state.events, state.players);
          this.applyStateDiff(agent, nightAction.stateUpdates, state.round, state.players);
          this.dispatch({ type: 'SUBMIT_NIGHT_ACTION', payload: nightAction });
        } catch (error) {
          console.error('Night action failed:', error);
        }
        await this.delay(600);
      }
    }

    // Doctor
    const aliveDoctor = state.players.find(p => p.isAlive && p.role === 'doctor');
    if (aliveDoctor) {
      const agent = this.agents.get(aliveDoctor.id);
      if (agent) {
        try {
          const nightAction = await this.agentRunner.getNightAction(agent, 'doctor_protect', state.events, state.players);
          this.applyStateDiff(agent, nightAction.stateUpdates, state.round, state.players);
          // Doctor cannot protect themselves
          if (nightAction.targetId === aliveDoctor.id) {
            const otherAlive = state.players.filter(p => p.isAlive && p.id !== aliveDoctor.id);
            if (otherAlive.length > 0) {
              nightAction.targetId = otherAlive[Math.floor(Math.random() * otherAlive.length)].id;
            }
          }
          this.dispatch({ type: 'SUBMIT_NIGHT_ACTION', payload: nightAction });
        } catch (error) {
          console.error('Night action failed:', error);
        }
        await this.delay(600);
      }
    }

    // Re-read state after all actions submitted
    const updatedState = this.getState();

    // Resolve night actions
    const result = resolveNightActions(updatedState.nightActions, updatedState.players, updatedState.round);

    this.dispatch({
      type: 'RESOLVE_NIGHT',
      payload: {
        events: result.events,
        killedPlayerId: result.killedPlayerId,
      },
    });

    // Update known roles for all agents after elimination
    if (result.killedPlayerId) {
      const killed = updatedState.players.find(p => p.id === result.killedPlayerId);
      if (killed) {
        this.updateKnownRolesAfterElimination(killed);
      }
    }

    // Update detective known roles from investigation
    result.events.forEach(event => {
      if (event.type === 'investigation' && event.targetId) {
        const target = updatedState.players.find(p => p.id === event.targetId);
        const detective = this.agents.get(event.actorId);
        if (target && detective) {
          detective.knownRoles[target.name] = target.role;
          if (detective.beliefs.players[target.id]) {
            const suspectedRole = target.role === 'mafia' ? 'mafia' : 'civilian';
            detective.beliefs.players[target.id].suspectedRole = suspectedRole;
            detective.beliefs.players[target.id].reason = 'Confirmed by investigation.';
          }
        }
      }
    });

    this.persistAgents();

    // Move dead players to the same room as ghosts (no longer isolating to study)
    if (result.killedPlayerId) {
      // No special movement needed — moveCharactersToRoom handles all players together
    }

    // Update agent memories
    result.events.forEach((event) => {
      this.agents.forEach((agent) => {
        if (event.isPublic || agent.role === 'detective') {
          agent.memory.push(event);
        }
      });
    });

    // Check win conditions
    if (this.checkWinCondition(updatedState.players)) {
      return;
    }

    // Start day discussion
    await this.delay(1000);
    this.startDiscussion();
  }

  async startDiscussion(): Promise<void> {
    this.dispatch({ type: 'START_DISCUSSION' });

    // Move characters to dining room
    this.moveCharactersToRoom('dining');
    await this.delay(1200);

    const state = this.getState();
    // Shuffle speaking order each round so it's not always the same players first
    const alivePlayers = this.shuffle(state.players.filter((p) => p.isAlive));

    for (const player of alivePlayers) {
      if (!this.isRunning) return;

      const agent = this.agents.get(player.id);
      if (!agent) continue;

      // Check if human is in control
      if (player.isHuman && state.humanInControl) {
        // Human speaks - will be handled by UI
        await this.delay(800 / state.speed);
      } else {
        try {
          // Get AI speech
          const whisper = this.whispers.get(player.id);
          const result = await this.agentRunner.getSpeech(agent, state.round, state.events, state.players, whisper);
          
          // Apply state updates from LLM
          this.applyStateDiff(agent, result.stateUpdates, state.round, state.players);
          
          const event: GameEvent = {
            round: state.round,
            phase: 'day_discussion',
            type: 'speech',
            actorId: player.id,
            content: result.speech,
            timestamp: Date.now(),
            isPublic: true,
          };

          this.dispatch({ type: 'ADD_SPEECH', payload: event });
          agent.memory.push(event);
          this.whispers.delete(player.id);
        } catch (error) {
          console.error(`Speech failed for ${player.name}:`, error);
          const fallbackSpeeches = [
            "I'm not sure what to think yet.",
            "I need more information before I can decide.",
            "Something feels off, but I can't put my finger on it.",
            "Let's see what happens next.",
            "I'm watching everyone carefully."
          ];
          const event: GameEvent = {
            round: state.round,
            phase: 'day_discussion',
            type: 'speech',
            actorId: player.id,
            content: fallbackSpeeches[Math.floor(Math.random() * fallbackSpeeches.length)],
            timestamp: Date.now(),
            isPublic: true,
          };
          this.dispatch({ type: 'ADD_SPEECH', payload: event });
        }
        await this.delay(800 / state.speed);
      }
    }

    // Start voting
    this.startVote();
  }

  async startVote(): Promise<void> {
    this.dispatch({ type: 'START_VOTE' });

    // Move characters to parlour (voting booth)
    this.moveCharactersToRoom('parlour');
    await this.delay(1200);

    const state = this.getState();
    const alivePlayers = state.players.filter((p) => p.isAlive);
    const votes: Record<string, string> = {};

    // Collect votes SEQUENTIALLY to avoid rate limits, with visual indicator updating as we go
    for (const player of alivePlayers) {
      if (!this.isRunning) return;

      const agent = this.agents.get(player.id);
      if (!agent) continue;

      if (player.isHuman && state.humanInControl) {
        // Human votes - handled by UI
        await this.delay(600 / state.speed);
      } else {
        try {
          const result = await this.agentRunner.getVote(agent, state.events, state.players);
          
          // Apply state updates from LLM
          this.applyStateDiff(agent, result.stateUpdates, state.round, state.players);
          
          // Validate: target must be a valid alive player (not self)
          const target = state.players.find(p => p.id === result.targetId && p.isAlive && p.id !== player.id);
          let finalTargetId = result.targetId;
          if (!target) {
            // Fallback: random valid target
            const validTargets = state.players.filter(p => p.isAlive && p.id !== player.id);
            if (validTargets.length > 0) {
              finalTargetId = validTargets[Math.floor(Math.random() * validTargets.length)].id;
            }
          }
          
          // Record voting history
          agent.votingHistory.push({
            round: state.round,
            targetId: finalTargetId,
            reason: result.reasoning,
          });
          
          votes[player.id] = finalTargetId;
          this.dispatch({
            type: 'SUBMIT_VOTE',
            payload: { voterId: player.id, targetId: finalTargetId },
          });
        } catch (error) {
          console.error(`Vote failed for ${player.name}:`, error);
          // Fallback: random vote
          const targets = state.players.filter(p => p.isAlive && p.id !== player.id);
          const randomTarget = targets[Math.floor(Math.random() * targets.length)];
          if (randomTarget) {
            votes[player.id] = randomTarget.id;
            this.dispatch({
              type: 'SUBMIT_VOTE',
              payload: { voterId: player.id, targetId: randomTarget.id },
            });
          }
        }
        await this.delay(500 / state.speed);
      }
    }

    // Re-read state to include human votes
    const updatedState = this.getState();
    const allVotes = { ...votes, ...updatedState.votes };

    // Resolve votes
    const voteResult = countVotes(allVotes, updatedState.players, updatedState.round);

    this.dispatch({
      type: 'RESOLVE_VOTE',
      payload: {
        events: voteResult.events,
        eliminatedPlayerId: voteResult.eliminatedPlayerId,
      },
    });

    if (voteResult.eliminatedPlayerId) {
      const eliminated = updatedState.players.find(p => p.id === voteResult.eliminatedPlayerId);
      if (eliminated) {
        this.updateKnownRolesAfterElimination(eliminated);
      }
    }

    this.persistAgents();

    // Update agent memories
    voteResult.events.forEach((event) => {
      this.agents.forEach((agent) => {
        agent.memory.push(event);
      });
    });

    // Check win conditions
    const finalState = this.getState();
    if (this.checkWinCondition(finalState.players)) {
      return;
    }

    // Next night
    await this.delay(1500);
    this.startNight();
  }

  private checkWinCondition(players: Player[]): boolean {
    const aliveMafia = players.filter((p) => p.isAlive && p.role === 'mafia').length;
    const aliveCivilians = players.filter((p) => p.isAlive && p.role !== 'mafia').length;

    if (aliveMafia === 0) {
      this.dispatch({ type: 'GAME_OVER', payload: { winner: 'civilian' } });
      this.isRunning = false;
      return true;
    }

    if (aliveMafia >= aliveCivilians) {
      this.dispatch({ type: 'GAME_OVER', payload: { winner: 'mafia' } });
      this.isRunning = false;
      return true;
    }

    return false;
  }

  private moveCharactersToRoom(roomId: string): void {
    const positions = roomPositions[roomId] || roomPositions['dining'];
    const state = this.getState();

    // Move ALL players (alive and dead) to the new room.
    // Dead players appear as translucent ghosts in the same space.
    let positionIndex = 0;
    state.players.forEach((player) => {
      const pos = positions[positionIndex % positions.length];
      positionIndex++;
      this.dispatch({
        type: 'SET_TARGET_POSITION',
        payload: {
          playerId: player.id,
          targetPosition: pos,
        },
      });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  setWhisper(agentId: string, message: string): void {
    this.whispers.set(agentId, message);
  }

  stop(): void {
    this.isRunning = false;
  }
}
