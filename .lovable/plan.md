

# Add Google Places API Integration

## Overview
Replace the hardcoded sample business data (`SAMPLE_SPOTS`) with real, nearby businesses fetched from the Google Places API. This will give users actual restaurant names, real photos, ratings, and neighborhood info based on their location.

## What You Need to Do First
You'll need a **Google Places API key** from Google Cloud:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **Places API (New)** (or "Places API")
4. Go to **APIs & Services > Credentials** and create an API key
5. (Recommended) Restrict the key to only the Places API

Once you have the key, Lovable will securely store it so it's never exposed in your app code.

## How It Will Work

```text
User opens app
       |
       v
  Browser gets GPS coords (already working)
       |
       v
  User taps "Spin the Wheel" or "Start a Spin Sesh"
       |
       v
  Edge function "search-places" called with:
    - latitude/longitude
    - vibe intent (food, drinks, activity, etc.)
    - energy level + filters
       |
       v
  Edge function queries Google Places API
    - Nearby Search by category keywords
    - Returns real names, photos, ratings, addresses
       |
       v
  Results mapped to Spot[] format
    - Real business name, neighborhood, rating
    - Google photo URL (or gradient fallback)
       |
       v
  Spots used for swiping + results (same UI)
```

## Technical Details

### 1. Store the API Key
- Add `GOOGLE_PLACES_API_KEY` as a backend secret (you'll be prompted to paste it)

### 2. New Edge Function: `search-places`
Create `supabase/functions/search-places/index.ts` that:
- Accepts: `latitude`, `longitude`, `intent`, `energy`, `filters`
- Maps vibe intents to Google Places types (e.g., `food` to `restaurant`, `drinks` to `bar`)
- Calls Google Places Nearby Search API
- Returns up to 10-15 real businesses with: name, address, rating, price level, photo reference, location, neighborhood
- Uses Google's Place Photos API to generate real image URLs
- Falls back to the existing `SAMPLE_SPOTS` if the API call fails or no location is available

### 3. New Hook: `usePlacesSearch`
Create `src/hooks/usePlacesSearch.ts` that:
- Takes vibe input + coordinates
- Calls the `search-places` edge function
- Maps Google results into the existing `Spot` interface
- Includes session-level caching (same as events)
- Returns `{ spots, isLoading, error }`

### 4. Update Game Flow (`Index.tsx` + `useGameState.ts`)
- When starting a game (solo or sesh), if GPS coordinates are available:
  - Call `usePlacesSearch` to fetch real nearby spots
  - Use those as the spots for swiping
- If no location or API fails:
  - Fall back to the existing hardcoded `SAMPLE_SPOTS` (no breakage)
- Add a brief loading state ("Finding spots near you...") while the API call completes

### 5. What Stays the Same
- All UI components (cards, swiping, results, fortune wheel)
- The `Spot` interface structure
- Fortune system
- Group voting / Spin Sesh flow
- Event discovery section

### 6. Config Update
- Add the new `search-places` function to `config.toml` with `verify_jwt = false`

