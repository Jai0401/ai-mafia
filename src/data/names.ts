// src/data/names.ts
import type {  HatType  } from "../types/game";

export const maleAgentNames: string[] = [
  'Viktor',
  'Marcus',
  'Dante',
  'Silas',
  'Felix',
  'Atlas',
  'Cassius',
  'Kael',
  'Orion',
  'Draven',
];

export const femaleAgentNames: string[] = [
  'Luna',
  'Celeste',
  'Iris',
  'Ophelia',
  'Isolde',
  'Nova',
  'Raven',
  'Lyra',
  'Zara',
  'Elara',
];

// Combined pool for backward compatibility
export const agentNames: string[] = [...maleAgentNames, ...femaleAgentNames];

export function getRandomNameForGender(
  gender: 'male' | 'female',
  exclude: Set<string> = new Set()
): string {
  const pool = gender === 'male' ? maleAgentNames : femaleAgentNames;
  const available = pool.filter(n => !exclude.has(n));
  if (available.length === 0) {
    // Fallback: pick any unused name from combined pool
    const fallback = agentNames.filter(n => !exclude.has(n));
    if (fallback.length === 0) return 'Agent';
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

export const characterColors: string[] = [
  '#e74c3c',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#3498db',
];

export const hatTypes: HatType[] = [
  'duck',
  'tophat',
  'bowler',
  'beret',
  'crown',
  'cap',
];

export const characterAvatars: string[] = [
  '/images/characters/mystic.png',
  '/images/characters/rebel.png',
  '/images/characters/veteran.png',
  '/images/characters/elder.png',
  '/images/characters/maiden.png',
  '/images/characters/brawler.png',
  '/images/characters/whiz.png',
  '/images/characters/professor.png',
  '/images/characters/director.png',
  '/images/characters/phantom.png',
];
