// src/context/gameReducer.ts
import type {  GameState, GameEvent, NightAction, Phase, HumanMode, Player  } from "../types/game";

export type GameAction =
  | { type: 'INIT_GAME'; payload: { players: Player[]; humanPlayerId?: string; humanMode?: HumanMode } }
  | { type: 'START_NIGHT' }
  | { type: 'SUBMIT_NIGHT_ACTION'; payload: NightAction }
  | { type: 'RESOLVE_NIGHT'; payload: { events: GameEvent[]; killedPlayerId?: string } }
  | { type: 'START_DISCUSSION' }
  | { type: 'ADD_SPEECH'; payload: GameEvent }
  | { type: 'START_VOTE' }
  | { type: 'SUBMIT_VOTE'; payload: { voterId: string; targetId: string } }
  | { type: 'RESOLVE_VOTE'; payload: { events: GameEvent[]; eliminatedPlayerId?: string } }
  | { type: 'SET_PHASE'; payload: Phase }
  | { type: 'GAME_OVER'; payload: { winner: 'civilian' | 'mafia' } }
  | { type: 'SET_SPEED'; payload: 1 | 2 | 4 }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'TOGGLE_REVEAL_ROLES' }
  | { type: 'TOGGLE_HUMAN_CONTROL' }
  | { type: 'HUMAN_SPEECH'; payload: { content: string } }
  | { type: 'HUMAN_VOTE'; payload: { targetId: string } }
  | { type: 'HUMAN_NIGHT_ACTION'; payload: NightAction }
  | { type: 'HUMAN_WHISPER'; payload: { targetId: string; message: string } }
  | { type: 'UPDATE_PLAYER_POSITION'; payload: { playerId: string; position: { x: number; y: number } } }
  | { type: 'SET_TARGET_POSITION'; payload: { playerId: string; targetPosition: { x: number; y: number } } };

export const initialState: GameState = {
  phase: 'lobby',
  round: 1,
  players: [],
  events: [],
  nightActions: [],
  votes: {},
  winner: null,
  speed: 1,
  isPaused: false,
  revealAllRoles: false,
  humanInControl: false,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': {
      return {
        ...initialState,
        players: action.payload.players,
        humanPlayerId: action.payload.humanPlayerId,
        humanMode: action.payload.humanMode,
      };
    }

    case 'START_NIGHT': {
      return {
        ...state,
        phase: 'night',
        nightActions: [],
      };
    }

    case 'SUBMIT_NIGHT_ACTION': {
      return {
        ...state,
        nightActions: [...state.nightActions, action.payload],
      };
    }

    case 'RESOLVE_NIGHT': {
      const newPlayers = state.players.map((p) => {
        if (action.payload.killedPlayerId && p.id === action.payload.killedPlayerId) {
          return { ...p, isAlive: false };
        }
        return p;
      });
      return {
        ...state,
        phase: 'day_discussion',
        events: [...state.events, ...action.payload.events],
        players: newPlayers,
      };
    }

    case 'START_DISCUSSION': {
      return {
        ...state,
        phase: 'day_discussion',
      };
    }

    case 'ADD_SPEECH': {
      return {
        ...state,
        events: [...state.events, action.payload],
      };
    }

    case 'START_VOTE': {
      return {
        ...state,
        phase: 'day_vote',
        votes: {},
      };
    }

    case 'SUBMIT_VOTE': {
      return {
        ...state,
        votes: { ...state.votes, [action.payload.voterId]: action.payload.targetId },
      };
    }

    case 'RESOLVE_VOTE': {
      const newPlayers = state.players.map((p) => {
        if (action.payload.eliminatedPlayerId && p.id === action.payload.eliminatedPlayerId) {
          return { ...p, isAlive: false };
        }
        return p;
      });
      return {
        ...state,
        phase: 'night',
        round: state.round + 1,
        events: [...state.events, ...action.payload.events],
        players: newPlayers,
        votes: {},
      };
    }

    case 'SET_PHASE': {
      return { ...state, phase: action.payload };
    }

    case 'GAME_OVER': {
      return {
        ...state,
        phase: 'game_over',
        winner: action.payload.winner,
      };
    }

    case 'SET_SPEED': {
      return { ...state, speed: action.payload };
    }

    case 'TOGGLE_PAUSE': {
      return { ...state, isPaused: !state.isPaused };
    }

    case 'TOGGLE_REVEAL_ROLES': {
      return { ...state, revealAllRoles: !state.revealAllRoles };
    }

    case 'TOGGLE_HUMAN_CONTROL': {
      return { ...state, humanInControl: !state.humanInControl };
    }

    case 'HUMAN_SPEECH': {
      const speechEvent: GameEvent = {
        round: state.round,
        phase: 'day_discussion',
        type: 'speech',
        actorId: state.humanPlayerId!,
        content: action.payload.content,
        timestamp: Date.now(),
        isPublic: true,
      };
      return {
        ...state,
        events: [...state.events, speechEvent],
      };
    }

    case 'HUMAN_VOTE': {
      return {
        ...state,
        votes: {
          ...state.votes,
          [state.humanPlayerId!]: action.payload.targetId,
        },
      };
    }

    case 'HUMAN_NIGHT_ACTION': {
      return {
        ...state,
        nightActions: [...state.nightActions, action.payload],
      };
    }

    case 'HUMAN_WHISPER': {
      const whisperEvent: GameEvent = {
        round: state.round,
        phase: state.phase,
        type: 'system',
        actorId: 'director',
        targetId: action.payload.targetId,
        content: `Whisper to ${action.payload.targetId}: ${action.payload.message}`,
        timestamp: Date.now(),
        isPublic: false,
      };
      return {
        ...state,
        events: [...state.events, whisperEvent],
      };
    }

    case 'UPDATE_PLAYER_POSITION': {
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId ? { ...p, position: action.payload.position } : p,
        ),
      };
    }

    case 'SET_TARGET_POSITION': {
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId ? { ...p, targetPosition: action.payload.targetPosition } : p,
        ),
      };
    }

    default:
      return state;
  }
}
