import { Spot } from '@/types/game';

/**
 * Curated micro-adventures for free/budget users.
 * These are whimsical, low-cost or free suggestions
 * that don't require Google Places data.
 */
export const MICRO_ADVENTURES: Spot[] = [
  {
    id: 'micro-1',
    name: 'Sunset Walk by the River',
    category: 'activity',
    description: 'Find the nearest river trail and chase golden hour.',
    priceLevel: 1,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400',
    tags: ['Free', 'Outdoor', 'Scenic'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'chill',
  },
  {
    id: 'micro-2',
    name: 'Picnic in the Park',
    category: 'activity',
    description: 'Grab a blanket and your favorite snacks. That\'s it.',
    priceLevel: 1,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400',
    tags: ['Free', 'Relaxing', 'Nature'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'chill',
  },
  {
    id: 'micro-3',
    name: 'Window Shopping Adventure',
    category: 'activity',
    description: 'Explore a neighborhood you\'ve never walked through.',
    priceLevel: 1,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    tags: ['Free', 'Explore', 'Urban'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'moderate',
  },
  {
    id: 'micro-4',
    name: 'Mural Hunt',
    category: 'activity',
    description: 'Find 5 murals you\'ve never noticed before. Document the journey.',
    priceLevel: 1,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400',
    tags: ['Free', 'Art', 'Walking'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'moderate',
  },
  {
    id: 'micro-5',
    name: 'Library Wander',
    category: 'activity',
    description: 'Pick a random book. Read the first chapter in a cozy corner.',
    priceLevel: 1,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
    tags: ['Free', 'Quiet', 'Cozy'],
    isOutdoor: false,
    smokingFriendly: false,
    vibeLevel: 'chill',
  },
  {
    id: 'micro-6',
    name: 'Stargazing Spot',
    category: 'activity',
    description: 'Find the darkest spot near you. Look up. Breathe.',
    priceLevel: 1,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
    tags: ['Free', 'Night', 'Nature'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'chill',
  },
  {
    id: 'micro-7',
    name: 'Sunrise Spot Discovery',
    category: 'activity',
    description: 'Set an early alarm. Find the best sunrise view near you.',
    priceLevel: 1,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400',
    tags: ['Free', 'Scenic', 'Morning'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'chill',
  },
  {
    id: 'micro-8',
    name: 'People Watch at a Café',
    category: 'cafe',
    description: 'Order the cheapest drink. Watch the world go by.',
    priceLevel: 1,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400',
    tags: ['Budget', 'Chill', 'Social'],
    isOutdoor: false,
    smokingFriendly: false,
    vibeLevel: 'chill',
  },
  {
    id: 'micro-9',
    name: 'Free Museum Day',
    category: 'activity',
    description: 'Many museums have free admission days. Today could be one.',
    priceLevel: 1,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400',
    tags: ['Free', 'Culture', 'Indoor'],
    isOutdoor: false,
    smokingFriendly: false,
    vibeLevel: 'chill',
  },
  {
    id: 'micro-10',
    name: 'Photography Walk',
    category: 'activity',
    description: 'Take your phone. Capture 10 beautiful things around you.',
    priceLevel: 1,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400',
    tags: ['Free', 'Creative', 'Explore'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'moderate',
  },
  {
    id: 'micro-11',
    name: 'Thrift Store Treasure Hunt',
    category: 'shopping',
    description: 'Set a $5 budget. Find the best treasure you can.',
    priceLevel: 1,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
    tags: ['Budget', 'Shopping', 'Fun'],
    isOutdoor: false,
    smokingFriendly: false,
    vibeLevel: 'moderate',
  },
  {
    id: 'micro-12',
    name: 'Nature Meditation',
    category: 'activity',
    description: 'Find a tree. Sit under it. Close your eyes for 10 minutes.',
    priceLevel: 1,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    tags: ['Free', 'Wellness', 'Peaceful'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'chill',
  },
];

/**
 * Get micro adventures filtered by vibe
 */
export function getMicroAdventures(vibe?: string | null, count: number = 6): Spot[] {
  let pool = [...MICRO_ADVENTURES];
  
  // Filter by vibe when applicable
  if (vibe === 'reset' || vibe === 'free-beautiful') {
    pool = pool.filter(s => s.isOutdoor || s.vibeLevel === 'chill');
  } else if (vibe === 'momentum') {
    pool = pool.filter(s => s.vibeLevel === 'moderate' || s.vibeLevel === 'active');
  } else if (vibe === 'golden-hour') {
    pool = pool.filter(s => s.isOutdoor || s.tags.includes('Scenic'));
  } else if (vibe === 'explore') {
    pool = pool.filter(s => s.tags.includes('Explore') || s.tags.includes('Art') || s.tags.includes('Culture'));
  }
  
  // Shuffle and return
  return pool.sort(() => Math.random() - 0.5).slice(0, count);
}
