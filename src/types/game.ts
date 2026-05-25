// src/types/game.ts

export type Phase = 'lobby' | 'night' | 'day_discussion' | 'day_vote' | 'game_over';
export type Role = 'mafia' | 'detective' | 'doctor' | 'civilian';
export type HumanMode = 'spectator' | 'player' | 'director';

export interface Player {
  id: string;
  name: string;
  role: Role;
  personality: string;
  isAlive: boolean;
  isHuman: boolean;
  color: string;
  hat: HatType;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
}

export type HatType = 'duck' | 'tophat' | 'bowler' | 'beret' | 'crown' | 'cap';

export interface GameEvent {
  round: number;
  phase: Phase;
  type: 'speech' | 'vote' | 'elimination' | 'investigation' | 'protection' | 'system';
  actorId: string;
  targetId?: string;
  content: string;
  timestamp: number;
  isPublic: boolean;
}

export interface NightAction {
  playerId: string;
  action: 'mafia_kill' | 'detective_investigate' | 'doctor_protect';
  targetId: string;
  reasoning?: string;
}

export interface GameState {
  phase: Phase;
  round: number;
  players: Player[];
  events: GameEvent[];
  nightActions: NightAction[];
  votes: Record<string, string>;
  winner: 'civilian' | 'mafia' | null;
  humanPlayerId?: string;
  humanMode?: HumanMode;
  speed: 1 | 2 | 4;
  isPaused: boolean;
  revealAllRoles: boolean;
  humanInControl: boolean;
}

export interface AgentState {
  id: string;
  name: string;
  role: Role;
  personality: PersonalityProfile;
  memory: GameEvent[];
  suspicions: Record<string, number>;
  trust: Record<string, number>;
  privateNotes: string;
}

export interface PersonalityProfile {
  name: string;
  description: string;
  suspicionBias: number;
  voteTendency: 'independent' | 'majority' | 'loyal';
  bluffer: boolean;
}

export type { GameAction } from '../context/gameReducer';

export interface RoomLayout {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon: string;
  description: string;
}
