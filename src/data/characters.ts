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
    id: 'mystic',
    name: 'Mystic',
    title: 'THE MYSTIC',
    image: '/images/characters/mystic.png',
    color: '#e08ac4',
  },
  {
    id: 'rebel',
    name: 'Rebel',
    title: 'THE REBEL',
    image: '/images/characters/rebel.png',
    color: '#4aaa6a',
  },
  {
    id: 'veteran',
    name: 'Veteran',
    title: 'THE VETERAN',
    image: '/images/characters/veteran.png',
    color: '#8b6f4e',
  },
  {
    id: 'elder',
    name: 'Elder',
    title: 'THE ELDER',
    image: '/images/characters/elder.png',
    color: '#c17e50',
  },
  {
    id: 'maiden',
    name: 'Maiden',
    title: 'THE MAIDEN',
    image: '/images/characters/maiden.png',
    color: '#d4a83a',
  },
  {
    id: 'brawler',
    name: 'Brawler',
    title: 'THE BRAWLER',
    image: '/images/characters/brawler.png',
    color: '#5a8aaa',
  },
  {
    id: 'whiz',
    name: 'Whiz',
    title: 'THE WHIZ',
    image: '/images/characters/whiz.png',
    color: '#f39c12',
  },
  {
    id: 'professor',
    name: 'Professor',
    title: 'THE PROFESSOR',
    image: '/images/characters/professor.png',
    color: '#7a8a9a',
  },
  {
    id: 'director',
    name: 'Director',
    title: 'THE DIRECTOR',
    image: '/images/characters/director.png',
    color: '#9b59b6',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    title: 'THE PHANTOM',
    image: '/images/characters/phantom.png',
    color: '#555555',
  },
];

export function getAvatarForIndex(index: number): CharacterAvatar {
  return CHARACTER_AVATARS[index % CHARACTER_AVATARS.length];
}
