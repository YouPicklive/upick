

# YouPick.live Stabilization + Cross-Platform Uniformity

## Overview

This plan addresses six areas of improvement: routing, state management, data contracts, performance, design system, and bot pages. No features, pages, or data will be removed -- only refactored, consolidated, and hardened.

---

## 1. Routing + Page Consolidation

**Current state:** Routes are clean with no duplicates. One issue exists: `useAutoPost` hardcodes `city: 'Richmond'` and `region: 'VA'` instead of using the selected city.

**Changes:**
- Create `src/lib/routes.ts` with a canonical route map constant so all navigation references use a single source of truth
- Fix `useAutoPost.ts` to pull city/region from the user's selected city instead of hardcoding Richmond
- Ensure all `navigate()` calls reference the route map constants

---

## 2. Single Source of Truth (State)

**Current state:** Auth, profile, city, entitlements, and freemium state are each in separate hooks, each independently calling `useAuth()` internally. Every page that uses `useFreemium` also triggers `useUserEntitlements` which triggers `useAuth` -- causing repeated auth listener setups and multiple identical queries.

**Changes:**
- Create `src/contexts/AppContext.tsx` -- a single React context provider that wraps the app and holds:
  - Auth session (from one `useAuth` call)
  - User profile (from one `useProfile` call)
  - Selected city (from one `useSelectedCity` call)
  - User entitlements (from one `useUserEntitlements` call)
- Expose via `useAppContext()` hook
- Refactor `useFreemium` to consume `useAppContext()` instead of independently calling `useAuth()` and `useUserEntitlements()`
- Refactor all pages (Index, Feed, Settings, EventsToday, PublicProfile, BotProfile) to use `useAppContext()` instead of calling multiple hooks independently
- This eliminates duplicate auth listeners and repeated Supabase queries on every page mount

---

## 3. Data Contracts + Filter Logic

**Current state:** Types exist but are scattered. The `Spot` interface in `game.ts` is used as the universal type. `FeedPost` is defined in `useFeed.ts`. No shared filter-building utility exists -- filter logic is duplicated across `useGameState`, `usePlacesSearch`, and `useAutoPost`.

**Changes:**
- Create `src/types/index.ts` that re-exports and formalizes:
  - `PlaceResult` (renamed from `Spot` for clarity, keeping backward compat alias)
  - `SpinResult` (the result of a spin action)
  - `FeedPost` (moved from hook to shared types)
  - `UserProfile` (moved from `useProfile`)
  - `BotProfile` (formalized from inline interface in BotProfile.tsx)
  - `SavedSpin`, `SavedActivity` (moved from hooks to shared types)
- Create `src/lib/build-filter-payload.ts`:
  - Single function `buildFilterPayload(vibeInput, selectedCity, coordinates)` that constructs the search params used by `search-places` edge function
  - Used by Index.tsx (spin), Feed filtering, and any future filter-dependent features
- Add defensive fallbacks in all list renders: empty array checks, optional chaining, and graceful "nothing found" UI states (already partially done, will audit and fill gaps)

---

## 4. Performance Pass

**Current state:** Several performance issues identified:
- `useUserEntitlements` polls `check-subscription` every 60 seconds for ALL authenticated users (even free tier)
- `useFeed` fetches profiles by querying `profiles` table with `.in()` -- but RLS only allows users to read their OWN profile, so this query returns empty for other users' posts
- Feed social shares fetch runs on every mount without caching
- No pagination on Feed (limit 50 hardcoded) or PublicProfile posts (limit 30)

**Changes:**
- Fix `useFeed.ts`: Change profile enrichment to query `profiles_public` view instead of `profiles` table (fixes the RLS issue where other users' display names/avatars show as null)
- Reduce subscription polling in `useUserEntitlements`: only poll every 60s for Plus/Premium users; free tier users check once on mount
- Add React Query caching for profile and entitlements data (the project already has `@tanstack/react-query` installed but isn't using it for these queries)
- Add skeleton loading states using the existing `Skeleton` component to Feed, EventsToday, and PublicProfile pages
- Add cursor-based pagination to Feed (load more button or infinite scroll) using `created_at` cursor
- Memoize expensive filter computations in `useGameState` with `useMemo`

---

## 5. UI Design System (Uniform Across Platforms)

**Current state:** The app has a cohesive visual language but components are defined inline in pages rather than as reusable primitives. Cards, feed items, and loaders are duplicated across Feed, PublicProfile, and BotProfile.

**Changes:**
- Extract shared components into `src/components/shared/`:
  - `PlaceCard.tsx` -- used in Feed, BotProfile, PublicProfile for place/result display
  - `FeedItem.tsx` -- extracted from Feed.tsx's inline `FeedCard`
  - `EmptyState.tsx` -- standardized empty state with icon, title, description, optional CTA
  - `PageLoader.tsx` -- full-page centered spinner with optional message
  - `LoadingSkeleton.tsx` -- configurable skeleton rows for lists
- Standardize layout wrapper: Create `PageContainer.tsx` component with consistent max-width, padding, safe-area insets (using `env(safe-area-inset-*)` CSS), and background
- Add safe-area CSS to `index.css`:
  - `padding-top: env(safe-area-inset-top)` on the sticky header
  - `padding-bottom: env(safe-area-inset-bottom)` on floating CTAs and bottom content
- Ensure all interactive elements have minimum 44x44px touch targets (audit buttons, chips, and tab items)
- Standardize the card component pattern: same border radius, padding, shadow, and hover state everywhere

---

## 6. Bot Pages + Avatars

**Current state:** Bot profiles work but have a simpler card layout than user profiles. Avatar URLs come from feed_posts.bot_avatar_url which references the `avatars` storage bucket.

**Changes:**
- Align BotProfile card layout with the same `PlaceCard` / `FeedItem` components used in the main feed
- Add the "Auto-curated" badge and subtype icons (already in Feed) to BotProfile post cards for consistency
- Ensure bot avatar images use the same avatar component and fallback logic as user profiles
- Add a subtle "Explorer Bot" badge to the bot profile header matching the existing `YouPick Explorer` label style

---

## Technical Implementation Order

1. Create `src/lib/routes.ts` and `src/types/index.ts` (foundational, no behavior change)
2. Create `src/contexts/AppContext.tsx` and `useAppContext` hook
3. Create `src/lib/build-filter-payload.ts`
4. Create shared components (`PlaceCard`, `FeedItem`, `EmptyState`, `PageLoader`, `PageContainer`)
5. Fix `useFeed.ts` to use `profiles_public` view
6. Refactor pages to use `AppContext`, shared components, and route constants
7. Fix `useAutoPost` hardcoded city
8. Add performance improvements (polling reduction, React Query caching, pagination)
9. Add safe-area CSS and touch target audit
10. Align BotProfile with shared components

---

## What Will NOT Change

- No features, pages, routes, categories, or flows removed
- No database tables or columns deleted
- No subscription/entitlement logic changed
- No fortune packs, vibes, or filter options removed
- Bot system, feed, events, and social sharing all preserved
- All existing RLS policies remain intact

