// src/data/roomLayout.ts
import type { RoomLayout } from '../types/game';

export const rooms: RoomLayout[] = [
  {
    id: 'library',
    name: 'Library',
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    color: '#4a90d9',
    icon: '📚',
    description: 'Night chat zone',
  },
  {
    id: 'dining',
    name: 'Dining Room',
    x: 50,
    y: 0,
    width: 50,
    height: 50,
    color: '#e8a84c',
    icon: '🍽️',
    description: 'Day discussion zone',
  },
  {
    id: 'study',
    name: 'Study',
    x: 0,
    y: 50,
    width: 50,
    height: 50,
    color: '#4a90d9',
    icon: '🔍',
    description: 'Detective den',
  },
  {
    id: 'parlour',
    name: 'Parlour',
    x: 50,
    y: 50,
    width: 50,
    height: 50,
    color: '#c0392b',
    icon: '🗳️',
    description: 'Voting booth',
  },
];

// Positions for characters in each room (percentage-based) - 6 spots to prevent overlapping
export const roomPositions: Record<string, { x: number; y: number }[]> = {
  library: [
    { x: 12, y: 18 },
    { x: 32, y: 15 },
    { x: 20, y: 38 },
    { x: 42, y: 35 },
    { x: 8, y: 42 },
    { x: 38, y: 48 },
  ],
  dining: [
    { x: 62, y: 18 },
    { x: 82, y: 15 },
    { x: 70, y: 38 },
    { x: 92, y: 35 },
    { x: 58, y: 42 },
    { x: 88, y: 48 },
  ],
  study: [
    { x: 12, y: 68 },
    { x: 32, y: 65 },
    { x: 20, y: 88 },
    { x: 42, y: 85 },
    { x: 8, y: 92 },
    { x: 38, y: 95 },
  ],
  parlour: [
    { x: 62, y: 68 },
    { x: 82, y: 65 },
    { x: 70, y: 88 },
    { x: 92, y: 85 },
    { x: 58, y: 92 },
    { x: 88, y: 95 },
  ],
};

export const hallwayPosition = { x: 50, y: 110 };
