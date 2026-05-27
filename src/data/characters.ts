// src/data/characters.ts
export interface CharacterAvatar {
  id: string;
  name: string;
  title: string;
  image: string;
  color: string;
}

export const CHARACTER_AVATARS: CharacterAvatar[] = [
  {
    id: 'veteran',
    name: 'Veteran',
    title: 'THE VETERAN',
    image: '/images/characters/veteran.png',
    color: '#c17e50',
  },
  {
    id: 'quiet_one',
    name: 'Quiet One',
    title: 'THE QUIET ONE',
    image: '/images/characters/quiet_one.png',
    color: '#888888',
  },
  {
    id: 'optimist',
    name: 'Optimist',
    title: 'THE OPTIMIST',
    image: '/images/characters/optimist.png',
    color: '#d4a83a',
  },
  {
    id: 'mysterious',
    name: 'Mysterious',
    title: 'THE MYSTERIOUS',
    image: '/images/characters/mysterious.png',
    color: '#5a8aaa',
  },
  {
    id: 'eccentric',
    name: 'Eccentric',
    title: 'THE ECCENTRIC',
    image: '/images/characters/eccentric.png',
    color: '#c44a3a',
  },
  {
    id: 'professional',
    name: 'Professional',
    title: 'THE PROFESSIONAL',
    image: '/images/characters/professional.png',
    color: '#7a5a4a',
  },
  {
    id: 'dreamer',
    name: 'Dreamer',
    title: 'THE DREAMER',
    image: '/images/characters/dreamer.png',
    color: '#c48aaa',
  },
  {
    id: 'rebel',
    name: 'Rebel',
    title: 'THE REBEL',
    image: '/images/characters/rebel.png',
    color: '#4aaa6a',
  },
];

export function getAvatarForIndex(index: number): CharacterAvatar {
  return CHARACTER_AVATARS[index % CHARACTER_AVATARS.length];
}
