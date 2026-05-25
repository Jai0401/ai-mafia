// src/engine/ActionResolver.ts
import type {  NightAction, GameEvent, Player, Role  } from "../types/game";

export interface NightResult {
  killedPlayerId?: string;
  savedPlayerId?: string;
  investigatedPlayerId?: string;
  investigationResult?: Role;
  events: GameEvent[];
}

export function resolveNightActions(
  nightActions: NightAction[],
  players: Player[],
  round: number,
): NightResult {
  const mafiaAction = nightActions.find((a) => a.action === 'mafia_kill');
  const doctorAction = nightActions.find((a) => a.action === 'doctor_protect');
  const detectiveAction = nightActions.find((a) => a.action === 'detective_investigate');

  const events: GameEvent[] = [];
  let killedPlayerId: string | undefined;
  let savedPlayerId: string | undefined;
  let investigatedPlayerId: string | undefined;
  let investigationResult: Role | undefined;

  // Resolve doctor protection
  if (doctorAction) {
    savedPlayerId = doctorAction.targetId;
    events.push({
      round,
      phase: 'night',
      type: 'protection',
      actorId: doctorAction.playerId,
      targetId: doctorAction.targetId,
      content: `${players.find((p) => p.id === doctorAction.playerId)?.name} protected someone.`,
      timestamp: Date.now(),
      isPublic: false,
    });
  }

  // Resolve mafia kill
  if (mafiaAction) {
    if (mafiaAction.targetId === savedPlayerId) {
      events.push({
        round,
        phase: 'night',
        type: 'system',
        actorId: 'system',
        content: `The Mafia targeted someone, but the Doctor saved them!`,
        timestamp: Date.now(),
        isPublic: true,
      });
    } else {
      killedPlayerId = mafiaAction.targetId;
      events.push({
        round,
        phase: 'night',
        type: 'elimination',
        actorId: mafiaAction.playerId,
        targetId: mafiaAction.targetId,
        content: `${players.find((p) => p.id === mafiaAction.targetId)?.name} was found dead in the morning.`,
        timestamp: Date.now(),
        isPublic: true,
      });
    }
  }

  // Resolve detective investigation
  if (detectiveAction) {
    investigatedPlayerId = detectiveAction.targetId;
    const targetPlayer = players.find((p) => p.id === detectiveAction.targetId);
    investigationResult = targetPlayer?.role;

    events.push({
      round,
      phase: 'night',
      type: 'investigation',
      actorId: detectiveAction.playerId,
      targetId: detectiveAction.targetId,
      content: `Investigation result: ${targetPlayer?.name} is a ${targetPlayer?.role}.`,
      timestamp: Date.now(),
      isPublic: false,
    });
  }

  return {
    killedPlayerId,
    savedPlayerId,
    investigatedPlayerId,
    investigationResult,
    events,
  };
}
