// src/data/roomLayout.ts
import type { RoomLayout } from '../types/game';

export interface RoomScene {
  id: string;
  name: string;
  icon: string;
  description: string;
  // Full-screen atmospheric colors
  bgGradient: string;
  ambientColor: string;
  floorColor: string;
  // Props / furniture silhouettes rendered as SVG
  props: React.ReactNode;
}

export const rooms: RoomLayout[] = [
  {
    id: 'library',
    name: 'The Library',
    x: 0, y: 0, width: 100, height: 100,
    color: '#4a90d9',
    icon: '📚',
    description: 'Night falls. The Mafia stirs.',
  },
  {
    id: 'dining',
    name: 'The Dining Hall',
    x: 0, y: 0, width: 100, height: 100,
    color: '#e8a84c',
    icon: '🍽️',
    description: 'Day breaks. Accusations fly.',
  },
  {
    id: 'parlour',
    name: 'The Parlour',
    x: 0, y: 0, width: 100, height: 100,
    color: '#c0392b',
    icon: '🗳️',
    description: 'The town votes. Justice or murder?',
  },
];

// Character positions within a full-screen room (percentage of room container)
// Arranged to look like they're gathered in a space, not a rigid grid
export const roomPositions: Record<string, { x: number; y: number }[]> = {
  library: [
    { x: 15, y: 30 },  { x: 30, y: 25 },  { x: 45, y: 28 },
    { x: 60, y: 26 },  { x: 75, y: 30 },  { x: 20, y: 55 },
    { x: 40, y: 50 },  { x: 55, y: 52 },  { x: 70, y: 55 },
    { x: 85, y: 48 },
  ],
  dining: [
    { x: 18, y: 35 },  { x: 35, y: 32 },  { x: 50, y: 30 },
    { x: 65, y: 33 },  { x: 82, y: 36 },  { x: 25, y: 58 },
    { x: 42, y: 55 },  { x: 58, y: 56 },  { x: 72, y: 58 },
    { x: 88, y: 54 },
  ],
  parlour: [
    { x: 12, y: 38 },  { x: 28, y: 35 },  { x: 44, y: 33 },
    { x: 56, y: 35 },  { x: 72, y: 38 },  { x: 88, y: 40 },
    { x: 20, y: 62 },  { x: 38, y: 60 },  { x: 62, y: 60 },
    { x: 80, y: 63 },
  ],
};

// Phase → active room mapping
export const phaseToRoom: Record<string, string> = {
  night: 'library',
  day_discussion: 'dining',
  day_vote: 'parlour',
  game_over: 'parlour',
};
