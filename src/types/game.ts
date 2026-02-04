export interface Spot {
  id: string;
  name: string;
  category: 'restaurant' | 'activity' | 'bar' | 'cafe';
  cuisine?: string;
  description: string;
  priceLevel: 1 | 2 | 3 | 4;
  rating: number;
  image: string;
  tags: string[];
}

export interface GameState {
  mode: 'landing' | 'setup' | 'playing' | 'results';
  playerCount: number;
  currentPlayer: number;
  spots: Spot[];
  remainingSpots: Spot[];
  votes: Record<string, number>;
  winner: Spot | null;
  category: 'all' | 'restaurant' | 'activity' | 'bar' | 'cafe';
}

export const SAMPLE_SPOTS: Spot[] = [
  {
    id: '1',
    name: 'Golden Dragon',
    category: 'restaurant',
    cuisine: 'Chinese',
    description: 'Authentic Szechuan cuisine with a modern twist',
    priceLevel: 2,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
    tags: ['Spicy', 'Family-friendly', 'Dine-in'],
  },
  {
    id: '2',
    name: 'Bella Italia',
    category: 'restaurant',
    cuisine: 'Italian',
    description: 'Handmade pasta and wood-fired pizzas',
    priceLevel: 3,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    tags: ['Romantic', 'Wine Bar', 'Outdoor Seating'],
  },
  {
    id: '3',
    name: 'Taco Fiesta',
    category: 'restaurant',
    cuisine: 'Mexican',
    description: 'Street-style tacos and fresh margaritas',
    priceLevel: 1,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    tags: ['Casual', 'Quick Bites', 'Late Night'],
  },
  {
    id: '4',
    name: 'Sakura Sushi',
    category: 'restaurant',
    cuisine: 'Japanese',
    description: 'Premium sushi and omakase experience',
    priceLevel: 4,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    tags: ['Fine Dining', 'Fresh Seafood', 'Sake Bar'],
  },
  {
    id: '5',
    name: 'The Rustic Burger',
    category: 'restaurant',
    cuisine: 'American',
    description: 'Gourmet burgers with craft beer selection',
    priceLevel: 2,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400',
    tags: ['Burgers', 'Craft Beer', 'Sports Bar'],
  },
  {
    id: '6',
    name: 'Strike Zone Bowling',
    category: 'activity',
    description: 'Modern bowling alley with arcade games',
    priceLevel: 2,
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=400',
    tags: ['Group Fun', 'Arcade', 'Birthday Parties'],
  },
  {
    id: '7',
    name: 'Escape Room Adventures',
    category: 'activity',
    description: 'Thrilling escape rooms for all skill levels',
    priceLevel: 3,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400',
    tags: ['Team Building', 'Mystery', 'Challenging'],
  },
  {
    id: '8',
    name: 'Craft & Canvas',
    category: 'activity',
    description: 'Paint and sip classes for beginners',
    priceLevel: 2,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
    tags: ['Creative', 'BYOB', 'Date Night'],
  },
  {
    id: '9',
    name: 'The Speakeasy',
    category: 'bar',
    description: 'Hidden cocktail bar with 1920s vibes',
    priceLevel: 3,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
    tags: ['Cocktails', 'Live Jazz', 'Intimate'],
  },
  {
    id: '10',
    name: 'Rooftop Lounge',
    category: 'bar',
    description: 'Stunning city views with craft cocktails',
    priceLevel: 3,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    tags: ['Views', 'Trendy', 'Happy Hour'],
  },
  {
    id: '11',
    name: 'The Cozy Bean',
    category: 'cafe',
    description: 'Artisan coffee and fresh pastries',
    priceLevel: 2,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
    tags: ['Coffee', 'WiFi', 'Study Spot'],
  },
  {
    id: '12',
    name: 'Garden Cafe',
    category: 'cafe',
    description: 'Organic brunch in a botanical setting',
    priceLevel: 2,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400',
    tags: ['Brunch', 'Vegan Options', 'Instagram-worthy'],
  },
];
