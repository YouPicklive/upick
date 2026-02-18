/**
 * Centralized type definitions for YouPick.live
 * Re-exports game types and formalizes shared interfaces.
 */

// Re-export all game types (backward compat)
export type { Spot, VibeInput, VibeIntent, VibeEnergy, VibeFilter, Preferences, GameState, YouPickVibe, ShoppingSubcategory } from './game';
export { SAMPLE_SPOTS, YOUPICK_VIBES, intentToCategories, computeRandomness, vibeToInternalMapping } from './game';

// Alias for clarity
export type { Spot as PlaceResult } from './game';

// Re-export from hooks for centralized access
export type { FeedPost } from '@/hooks/useFeed';
export type { Profile as UserProfile } from '@/hooks/useProfile';
export type { SavedSpin } from '@/hooks/useSavedSpins';
export type { SavedActivity } from '@/hooks/useSavedActivities';
export type { SpinResult } from '@/hooks/useFreemium';

/** Bot profile shape (formalized from BotProfile page) */
export interface BotProfile {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  postCount: number;
}
