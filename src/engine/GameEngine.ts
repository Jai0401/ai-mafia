// src/engine/GameEngine.ts
import type { GameState, GameEvent, AgentState, Player, HumanMode } from "../types/game";
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

    // Get night actions from alive players with roles
    const actionTypes: { playerId: string; action: 'mafia_kill' | 'detective_investigate' | 'doctor_protect' }[] = [];

    state.players.forEach((player) => {
      if (!player.isAlive) return;

      const agent = this.agents.get(player.id);
      if (!agent) return;

      if (player.role === 'mafia') {
        actionTypes.push({ playerId: player.id, action: 'mafia_kill' });
      } else if (player.role === 'detective') {
        actionTypes.push({ playerId: player.id, action: 'detective_investigate' });
      } else if (player.role === 'doctor') {
        actionTypes.push({ playerId: player.id, action: 'doctor_protect' });
      }
    });

    // Execute night actions with stagger
    for (const { playerId, action } of actionTypes) {
      const agent = this.agents.get(playerId);
      if (!agent) continue;

      try {
        const nightAction = await this.agentRunner.getNightAction(agent, action, state.events, state.players);
        this.dispatch({ type: 'SUBMIT_NIGHT_ACTION', payload: nightAction });
      } catch (error) {
        console.error('Night action failed:', error);
      }
      await this.delay(200);
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
    const alivePlayers = state.players.filter((p) => p.isAlive);

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
          const speech = await this.agentRunner.getSpeech(agent, state.round, state.events, state.players, whisper);

          const event: GameEvent = {
            round: state.round,
            phase: 'day_discussion',
            type: 'speech',
            actorId: player.id,
            content: speech,
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

    // Update suspicions after discussion
    await this.updateAllSuspicions(state);

    // Start voting
    this.startVote();
  }

  async startVote(): Promise<void> {
    this.dispatch({ type: 'START_VOTE' });

    // Move characters to parlour
    this.moveCharactersToRoom('parlour');
    await this.delay(1200);

    const state = this.getState();
    const alivePlayers = state.players.filter((p) => p.isAlive);
    const votes: Record<string, string> = {};

    for (const player of alivePlayers) {
      if (!this.isRunning) return;

      const agent = this.agents.get(player.id);
      if (!agent) continue;

      if (player.isHuman && state.humanInControl) {
        // Human votes - handled by UI
        await this.delay(600 / state.speed);
      } else {
        try {
          const voteResult = await this.agentRunner.getVote(agent, state.events, state.players);
          votes[player.id] = voteResult.targetId;
          this.dispatch({
            type: 'SUBMIT_VOTE',
            payload: { voterId: player.id, targetId: voteResult.targetId },
          });
        } catch (error) {
          // Fallback: random vote
          console.error(`Vote failed for ${player.name}:`, error);
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
        await this.delay(600 / state.speed);
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

  private async updateAllSuspicions(state: GameState): Promise<void> {
    const promises = Array.from(this.agents.values())
      .filter((agent) => state.players.find((p) => p.id === agent.id)?.isAlive)
      .map(async (agent) => {
        const recentEvents = state.events.slice(-5);
        try {
          const newSuspicions = await this.agentRunner.updateSuspicions(
            agent,
            recentEvents,
            state.players,
          );
          agent.suspicions = newSuspicions;
        } catch (error) {
          console.error('Failed to update suspicions:', error);
        }
      });

    await Promise.all(promises);
  }

  private moveCharactersToRoom(roomId: string): void {
    const positions = roomPositions[roomId] || roomPositions['dining'];
    const state = this.getState();

    state.players.forEach((player, i) => {
      const pos = positions[i % positions.length];
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
