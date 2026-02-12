

# Restore Vibe Selection Flow Before Spin

## Problem
Tapping "Spin the Wheel" currently skips the vibe/category selection and jumps straight into voting cards. The vibe screen component (`VibeScreen`) exists and works, but the landing page bypasses it entirely.

## Solution
Change the "Spin the Wheel" button to first send users through the Quick Vibe flow (intent, energy, filters), then start the game with real places after vibe selection is complete.

## Changes

### 1. `src/pages/Index.tsx`
- Change `handleSoloStart` so it sets mode to `'vibe'` instead of immediately starting the game
- Create a new `handleVibeComplete` function that contains the current game-start logic (spin tracking, places search, fallback)
- Pass `handleVibeComplete` as the `onStart` prop to `VibeScreen` instead of `handleSoloStart`

### 2. `src/components/game/LandingScreen.tsx`
- No changes needed -- "Spin the Wheel" already calls `onSoloStart`, which will now navigate to the vibe screen

## Flow After Fix

```text
Landing ("Spin the Wheel")
       |
       v
  Vibe Screen Step 0: Pick intent (food, drinks, activity, etc.)
       |
       v
  Vibe Screen Step 1: Pick energy (chill, social, adventure, etc.)
       |
       v
  Vibe Screen Step 2: Pick filters (cheap, outdoor, near-me, etc.)
       |
       v
  handleVibeComplete fires
    - checks spin limits
    - fetches real places from database using vibe + location
    - starts game with results
       |
       v
  Voting cards (playing mode)
```

## Technical Details

- In `handleSoloStart`: remove all game-start logic, replace with trial-mode check + `setMode('vibe')`
- New `handleVibeComplete` function: move the current spin-limit check, `useSpin()`, coordinate-based `searchPlaces()`, and `startGame()` calls here
- The `VibeScreen` `onStart` prop already fires when the user finishes the vibe steps, so wiring `handleVibeComplete` there completes the connection

