
# YouPick Phase 1 — Full Implementation Plan

## Pre-Implementation: What I Confirmed Reading the Code

Every line number, function signature, and existing pattern has been verified. Here is exactly what exists:

- `src/types/game.ts` line 29: `VibeFilter = 'cheap' | 'mid' | 'treat'` — must be extended
- `src/hooks/useGameState.ts` line 21: `filters: []` — default must become `['open-now', 'short-drive']`
- `src/hooks/usePlacesSearch.ts` line 20: `const cache = new Map<string, Spot[]>()` — module-level, safe to export a flush function from
- `src/hooks/useSelectedCity.ts` lines 107–124 (`selectCity`) and 126–135 (`clearCity`) — these two callbacks need `clearPlacesCache()` injected
- `src/components/game/VibeScreen.tsx` line 279: `isLocked = isPremiumPack && !isPremium && (pack.tier === 'plus' || !ownedPacks.includes(pack.id))` — the `pack.tier === 'plus'` branch is what prevents Plus users from seeing "Included ✓"
- `src/components/game/LandingScreen.tsx` line 228: same broken `isLocked` formula and line 250: same label
- `src/components/game/LandingScreen.tsx` line 213: `<p className="text-muted-foreground text-xs mt-2 text-center">One quick decision, guided by fate.</p>` — "Searching near:" label goes after this line
- `src/pages/PublicProfile.tsx` line 72: `useState<'activity' | 'saved'>('activity')` — needs `'markers'` added; tabs are at lines 198–219
- `src/pages/Feed.tsx` line 102: `<PostTypeLabel type={post.post_type} isBot={post.is_bot} subtype={post.post_subtype} />` — "Explorer Bot" badge goes before this, inside the `<div className="flex items-center gap-2">` at line 84
- `src/pages/Feed.tsx` line 179–195: `toggleLike` — already has `post.liked_by_me` check, award points only on the `else` branch (transitioning to liked)
- `src/hooks/useFeed.ts` line 33: `is_bot: boolean` already in `FeedPost` interface — no change needed there
- `supabase/functions/search-places/index.ts` line 154: `getGoogleRadiusMeters` function, line 146: `getMaxRadiusMiles` function, line 163: `googleNearbySearch` signature — all three need precise surgical edits
- `src/pages/Index.tsx` line 65: `const { selectedCity } = useSelectedCity()` — already destructured; line 143: `const realSpots = await searchPlaces(searchCoords, state.vibeInput)` — open-now empty state check goes after this
- `user_entitlements` table has `plus_active` boolean; `award_mile_markers` RPC will check this via `SECURITY DEFINER` which bypasses the "Deny public access" RLS policy correctly
- `profiles` table already has `is_bot`, `bot_slug`, `timezone` columns — bot seeds use existing schema
- `ResultsScreen.tsx` line 464–485: the "Save Spin" button with `saveSpin(...)` call — `awardPoints('save', 3)` fires after `if (saved) setSpinSaved(true)`
- `ResultsScreen.tsx` line 542: "Share My Fate" button calls `handleShareMyFate()` — `awardPoints('share', 5)` goes there

---

## Idempotency Approach (Final Confirmation)

For `redeem_mile_marker_reward`, the cleanest approach for this codebase is a **client-generated `request_id` stored in `reward_redemptions` with a UNIQUE constraint**. This is more robust than `(user_id, reward_id, created_at::date)` because:
- It handles the case where a user legitimately redeems the same reward type on different days
- It's explicit and auditable
- The client generates a UUID before calling the RPC; the RPC stores it

The `reward_redemptions` table gets a `request_id uuid UNIQUE` column. The client calls `redeem_mile_marker_reward(p_user_id, p_reward_id, p_request_id)`. If a duplicate `request_id` is submitted, the RPC returns `{success: false, reason: 'duplicate_request'}`.

---

## Step 1: Database Migration

**File:** `supabase/migrations/[timestamp]_mile_markers.sql`

### Tables

```sql
-- 1. mile_markers: one balance row per user
CREATE TABLE IF NOT EXISTS public.mile_markers (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_balance int NOT NULL DEFAULT 0,
  lifetime_points int NOT NULL DEFAULT 0,
  last_daily_award_date date NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT points_balance_non_negative CHECK (points_balance >= 0),
  CONSTRAINT lifetime_points_non_negative CHECK (lifetime_points >= 0)
);

-- 2. mile_marker_transactions: immutable ledger
CREATE TABLE IF NOT EXISTS public.mile_marker_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earn', 'redeem')),
  points int NOT NULL CHECK (points > 0),
  reason text NOT NULL CHECK (reason IN ('daily_open','spin','save','like','share','checkin','redeem_reward')),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mmt_user_id ON public.mile_marker_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_mmt_user_created ON public.mile_marker_transactions(user_id, created_at DESC);

-- 3. rewards: admin-managed marketplace
CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  points_cost int NOT NULL CHECK (points_cost > 0),
  partner_business_id uuid NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('gift_card','ticket','class','experience','getaway')),
  quantity_available int NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. reward_redemptions: claimed rewards with idempotency guard
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.rewards(id),
  points_spent int NOT NULL CHECK (points_spent > 0),
  redemption_code text NOT NULL,
  request_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','issued','redeemed','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_request_id UNIQUE (request_id)
);
CREATE INDEX IF NOT EXISTS idx_rr_user_id ON public.reward_redemptions(user_id);
```

### RLS Policies

```sql
ALTER TABLE public.mile_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mile_marker_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mile markers"
  ON public.mile_markers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON public.mile_marker_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Active rewards are publicly readable"
  ON public.rewards FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage rewards"
  ON public.rewards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own redemptions"
  ON public.reward_redemptions FOR SELECT USING (auth.uid() = user_id);
```

### updated_at trigger

```sql
CREATE TRIGGER update_mile_markers_updated_at
  BEFORE UPDATE ON public.mile_markers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### RPC: award_mile_markers

```sql
CREATE OR REPLACE FUNCTION public.award_mile_markers(
  p_user_id uuid,
  p_reason text,
  p_points int,
  p_metadata jsonb DEFAULT '{}'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_plus boolean;
  v_timezone text;
  v_today_date date;
  v_today_earned int;
  v_actual_points int;
  v_new_balance int;
  v_last_daily date;
BEGIN
  -- 1. Check Plus OR admin
  SELECT (plus_active = true) INTO v_is_plus
  FROM public.user_entitlements WHERE user_id = p_user_id;

  IF NOT COALESCE(v_is_plus, false) AND NOT public.has_role(p_user_id, 'admin') THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'not_plus');
  END IF;

  -- 2. Get user timezone (default America/New_York)
  SELECT COALESCE(timezone, 'America/New_York') INTO v_timezone
  FROM public.profiles WHERE id = p_user_id;

  -- 3. Today's date in user timezone
  v_today_date := (now() AT TIME ZONE v_timezone)::date;

  -- 4. Sum today's earned points in user timezone
  SELECT COALESCE(SUM(points), 0) INTO v_today_earned
  FROM public.mile_marker_transactions
  WHERE user_id = p_user_id
    AND type = 'earn'
    AND (created_at AT TIME ZONE v_timezone)::date = v_today_date;

  IF v_today_earned >= 75 THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'daily_cap');
  END IF;

  -- 5. daily_open guard: only once per calendar day
  IF p_reason = 'daily_open' THEN
    SELECT last_daily_award_date INTO v_last_daily
    FROM public.mile_markers WHERE user_id = p_user_id;
    IF v_last_daily IS NOT NULL AND v_last_daily = v_today_date THEN
      RETURN jsonb_build_object('awarded', false, 'reason', 'already_awarded_today');
    END IF;
  END IF;

  -- 6. Clamp to remaining cap
  v_actual_points := LEAST(p_points, 75 - v_today_earned);

  -- 7. Upsert mile_markers
  INSERT INTO public.mile_markers (
    user_id, points_balance, lifetime_points, last_daily_award_date, updated_at
  ) VALUES (
    p_user_id, v_actual_points, v_actual_points,
    CASE WHEN p_reason = 'daily_open' THEN v_today_date ELSE NULL END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    points_balance = public.mile_markers.points_balance + v_actual_points,
    lifetime_points = public.mile_markers.lifetime_points + v_actual_points,
    last_daily_award_date = CASE
      WHEN p_reason = 'daily_open' THEN v_today_date
      ELSE public.mile_markers.last_daily_award_date
    END,
    updated_at = now();

  -- 8. Insert transaction
  INSERT INTO public.mile_marker_transactions (user_id, type, points, reason, metadata)
  VALUES (p_user_id, 'earn', v_actual_points, p_reason, p_metadata);

  -- 9. Return new balance
  SELECT points_balance INTO v_new_balance FROM public.mile_markers WHERE user_id = p_user_id;
  RETURN jsonb_build_object('awarded', true, 'points_given', v_actual_points, 'new_balance', v_new_balance);
END;
$$;
```

### RPC: redeem_mile_marker_reward (atomic + idempotency)

```sql
CREATE OR REPLACE FUNCTION public.redeem_mile_marker_reward(
  p_user_id uuid,
  p_reward_id uuid,
  p_request_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_plus boolean;
  v_balance int;
  v_cost int;
  v_available int;
  v_reward_active boolean;
  v_code text;
BEGIN
  -- 1. Check Plus OR admin
  SELECT (plus_active = true) INTO v_is_plus
  FROM public.user_entitlements WHERE user_id = p_user_id;

  IF NOT COALESCE(v_is_plus, false) AND NOT public.has_role(p_user_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_plus');
  END IF;

  -- 2. Idempotency: check if request_id already used
  IF EXISTS (SELECT 1 FROM public.reward_redemptions WHERE request_id = p_request_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'duplicate_request');
  END IF;

  -- 3. Check reward exists, is active, has stock
  SELECT points_cost, active, quantity_available
  INTO v_cost, v_reward_active, v_available
  FROM public.rewards WHERE id = p_reward_id;

  IF NOT FOUND OR NOT v_reward_active THEN
    RETURN jsonb_build_object('success', false, 'reason', 'reward_not_found');
  END IF;

  IF v_available <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'out_of_stock');
  END IF;

  -- 4. Check user balance
  SELECT points_balance INTO v_balance FROM public.mile_markers WHERE user_id = p_user_id;
  IF v_balance IS NULL OR v_balance < v_cost THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance');
  END IF;

  -- 5. ATOMIC: decrement stock first (prevents race conditions)
  UPDATE public.rewards
  SET quantity_available = quantity_available - 1
  WHERE id = p_reward_id AND quantity_available > 0;

  -- If 0 rows updated, someone else grabbed the last item
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'out_of_stock');
  END IF;

  -- 6. Deduct points
  UPDATE public.mile_markers
  SET points_balance = points_balance - v_cost, updated_at = now()
  WHERE user_id = p_user_id;

  -- 7. Generate redemption code
  v_code := upper(substring(md5(random()::text || p_user_id::text || now()::text) from 1 for 8));

  -- 8. Insert redemption record (UNIQUE on request_id prevents double-submit)
  INSERT INTO public.reward_redemptions (
    user_id, reward_id, points_spent, redemption_code, request_id, status
  ) VALUES (
    p_user_id, p_reward_id, v_cost, v_code, p_request_id, 'pending'
  );

  -- 9. Log deduction transaction
  INSERT INTO public.mile_marker_transactions (user_id, type, points, reason, metadata)
  VALUES (
    p_user_id, 'redeem', v_cost, 'redeem_reward',
    jsonb_build_object('reward_id', p_reward_id, 'code', v_code, 'request_id', p_request_id)
  );

  RETURN jsonb_build_object('success', true, 'code', v_code);
END;
$$;
```

The entire body of `redeem_mile_marker_reward` runs inside a single implicit transaction in plpgsql — if any statement throws, Postgres rolls everything back automatically.

### Seed: 5 placeholder rewards

```sql
INSERT INTO public.rewards (title, description, points_cost, reward_type, quantity_available, active)
VALUES
  ('Free Coffee or Pastry',
   'A complimentary coffee or pastry — partner to be confirmed. Redeemed manually by the YouPick team.',
   150, 'gift_card', 50, true),
  ('$10 Local Restaurant Gift Card',
   'A $10 gift card to a local restaurant in your city — partner TBD.',
   250, 'gift_card', 25, true),
  ('Free Fitness or Yoga Class',
   'One complimentary class at a local studio — partner TBD.',
   300, 'class', 20, true),
  ('Local Event Ticket ($25 value)',
   'One ticket to a local experience or event — partner TBD.',
   500, 'ticket', 10, true),
  ('Weekend Discovery Package',
   'A curated weekend getaway experience — limited availability, partner TBD.',
   750, 'getaway', 5, true);
```

### Seed: 2 Richmond bot profiles

```sql
INSERT INTO public.profiles (id, username, display_name, city, region, is_bot, bot_slug, timezone)
VALUES
  (gen_random_uuid(), 'vibes.rva', 'RVA Vibes', 'Richmond', 'VA', true, 'vibes-rva', 'America/New_York'),
  (gen_random_uuid(), 'rva.explorer', 'Richmond Explorer', 'Richmond', 'VA', true, 'rva-explorer', 'America/New_York')
ON CONFLICT (username) DO NOTHING;
```

---

## Step 2: New Hook — `src/hooks/useMileMarkers.ts`

New file. Uses `supabase` client, `useAuth`, `useUserEntitlements`, `toast` from `sonner`.

```typescript
export interface MileMarkerTransaction {
  id: string; user_id: string; type: 'earn' | 'redeem'; points: number;
  reason: string; metadata: Record<string, unknown>; created_at: string;
}
export interface Reward {
  id: string; title: string; description: string; points_cost: number;
  reward_type: string; quantity_available: number; active: boolean; expires_at: string | null;
}
```

Exported hook values:
- `balance: number`
- `lifetimePoints: number`
- `transactions: MileMarkerTransaction[]` — last 20
- `rewards: Reward[]` — active rewards
- `isPlus: boolean` — from `useUserEntitlements().isPlus`
- `loading: boolean`
- `awardPoints(reason, points, metadata?): void` — async void. Calls `supabase.rpc('award_mile_markers', {p_user_id, p_reason, p_points, p_metadata})`. On `awarded: true`: calls `setBalance(new_balance)` and shows `toast("+N Mile Markers 🏁")`. On `awarded: false` or any error: silently no-ops. If `!isAuthenticated || !isPlus`: returns immediately without RPC call.
- `redeemReward(rewardId): Promise<{success: boolean; code?: string; reason?: string}>` — generates `crypto.randomUUID()` as `requestId`, calls `supabase.rpc('redeem_mile_marker_reward', {p_user_id, p_reward_id: rewardId, p_request_id: requestId})`. On success: calls `refetch()` and shows toast with redemption code.
- `refetch(): void` — re-queries balance + transactions + rewards

All data fetching is skipped when `!isAuthenticated || !isPlus` — returns zeros and empty arrays.

---

## Step 3: Wire Earning Events

All calls are `void awardPoints(...)` — fire and forget, no blocking.

**`src/pages/Index.tsx`:**
- Import `useMileMarkers`, destructure `{ awardPoints, isPlus }` from it.
- Add `useEffect` with `[user?.id]` dependency:
  ```typescript
  useEffect(() => {
    if (!user?.id) return;
    void awardPoints('daily_open', 5);
  }, [user?.id]);
  ```
  RPC enforces once-per-calendar-day; calling on mount every session is safe.
- In `handleVibeComplete`, after `startGame(realSpots)` at line 146, add:
  ```typescript
  void awardPoints('spin', 2);
  ```

**`src/components/game/ResultsScreen.tsx`:**
- Add optional prop: `onAwardPoints?: (reason: string, points: number) => void`
- After `if (saved) setSpinSaved(true)` at line 480: add `onAwardPoints?.('save', 3)`
- In "Share My Fate" handler `handleShareMyFate()`: add `onAwardPoints?.('share', 5)` near the start (before the async share work, so it fires regardless of share method)
- In `Index.tsx`, pass `onAwardPoints={awardPoints}` to `<ResultsScreen />`

**`src/pages/Feed.tsx`:**
- Import `useMileMarkers`, destructure `{ awardPoints }` from it.
- In `toggleLike` (line 179), the `else` branch (not liked → now liking) is `await supabase.from('post_likes').insert(...)`. After this insert: `void awardPoints('like', 1)`.

---

## Step 4: MileMarkersTab Component + Profile Integration

**New file: `src/components/profile/MileMarkersTab.tsx`**

Props: `{ userId: string }`

Uses `useMileMarkers()` internally.

The REASON_LABELS map:
```typescript
const REASON_LABELS: Record<string, string> = {
  daily_open: 'Daily visit',
  spin: 'Spin',
  save: 'Saved a spot',
  like: 'Liked a post',
  share: 'Shared',
  checkin: 'Check-in',
  redeem_reward: 'Redeemed reward',
};
```

Three visual states:

**Not Plus (locked):**
```
🏁 Mile Markers
[Lock icon]
Mile Markers are included with Plus ($5.99/mo)
Earn points for every spin, save, like, and share —
then redeem for real rewards from local businesses.
[Upgrade to Plus → /membership]
```

**Plus, loaded — 4 sections:**

1. Balance card: large `balance` display + "Lifetime: X pts" subtitle
2. Progress bar: `Math.min((balance / 500) * 100, 100)%` width — "Progress to first reward"
3. Transaction list: last 20 items. Each row: `REASON_LABELS[tx.reason]` + `+/- N pts` + `formatDistanceToNow(tx.created_at)`
4. Rewards Marketplace: grid of active rewards. Each card: title, description, points cost. "Redeem" button:
   - `quantity_available === 0` → shows "Out of stock", button disabled (grayed)
   - `balance < reward.points_cost` → shows "Need N more pts", button disabled
   - `balance >= reward.points_cost && quantity_available > 0` → "Redeem" button active, calls `redeemReward(reward.id)`

**`src/pages/PublicProfile.tsx` changes (3 precise edits):**

1. Line 72: `useState<'activity' | 'saved'>('activity')` → `useState<'activity' | 'saved' | 'markers'>('activity')`

2. After the closing `</button>` of the "Saved" tab button (~line 218), add:
   ```tsx
   {isOwner && (
     <button
       onClick={() => setActiveTab('markers')}
       className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
         activeTab === 'markers'
           ? 'border-primary text-primary'
           : 'border-transparent text-muted-foreground hover:text-foreground'
       }`}
     >
       🏁 Mile Markers
     </button>
   )}
   ```

3. After the `activeTab === 'saved'` conditional block, add:
   ```tsx
   {activeTab === 'markers' && isOwner && profile && (
     <MileMarkersTab userId={profile.id} />
   )}
   ```

Add import: `import { MileMarkersTab } from '@/components/profile/MileMarkersTab';`

---

## Step 5: Fortune Pack Entitlement Fix

Two files. Same logic fix in both.

**`src/components/game/VibeScreen.tsx` line 279:**

Change:
```typescript
const isLocked = isPremiumPack && !isPremium && (pack.tier === 'plus' || !ownedPacks.includes(pack.id));
```
To:
```typescript
const isLocked = isPremiumPack && !isPremium && !ownedPacks.includes(pack.id);
```

Line 301 label change:
```typescript
// From:
{isLocked && pack.tier === 'pack' ? '$2.99' : isLocked && pack.tier === 'plus' ? 'Plus' : pack.description}
// To:
{isLocked ? '$2.99' : isPremium && isPremiumPack ? 'Included ✓' : pack.description}
```

**`src/components/game/LandingScreen.tsx` line 228** — same `isLocked` fix.
**Line 250** — same label fix.

---

## Step 6: Open/Closed Filtering

### `supabase/functions/search-places/index.ts`

**Schema addition** (line 19, inside `SearchPlacesSchema`):
```typescript
openNow: z.boolean().optional().default(false),
```

**Destructure `openNow`** from `parsed.data` at the main destructuring block.

**`getGoogleRadiusMeters` function** (lines 154–159) — full replacement:
```typescript
function getGoogleRadiusMeters(filters?: string[], intent?: string | null): number {
  if (filters?.includes("near-me")) return 1600;       // ~1 mi
  if (filters?.includes("nearby")) return 4800;         // ~3 mi
  if (filters?.includes("short-drive")) return 8000;    // ~5 mi (default chip)
  if (filters?.includes("city-wide")) return 16000;     // ~10 mi
  if (filters?.includes("any-distance")) return 40000;  // ~25 mi
  if (intent === "events") return 8000;
  return 5000; // unchanged fallback
}
```

**`getMaxRadiusMiles` function** (lines 146–152) — full replacement:
```typescript
function getMaxRadiusMiles(filters?: string[]): number {
  if (!filters) return 15;
  if (filters.includes("near-me")) return 1;
  if (filters.includes("nearby")) return 3;
  if (filters.includes("short-drive")) return 5;
  if (filters.includes("city-wide")) return 10;
  if (filters.includes("any-distance")) return 45;
  return 15;
}
```

**`googleNearbySearch` function** (line 163) — add `openNow?: boolean` as last param. Inside, before the `fetch()` call: `if (openNow) params.append("opennow", "");`

**Business status filter** — add after each `allRawResults` collection in the 3 paths (shopping, events, standard Nearby). Before `runFilterPipeline` or `googlePlaceToSpot` calls:
```typescript
allRawResults = allRawResults.filter((r: any) =>
  r.business_status !== 'CLOSED_TEMPORARILY' &&
  r.business_status !== 'PERMANENTLY_CLOSED'
);
```
This runs regardless of `openNow` — closed businesses are NEVER returned.

Pass `openNow` to `googleNearbySearch` calls in the standard and shopping paths.

### `src/hooks/usePlacesSearch.ts`

After line 20 (`const cache = new Map...`), add:
```typescript
export function clearPlacesCache(): void { cache.clear(); }
```

In `searchPlaces` function body (lines 313–322), add `openNow` to the edge function body:
```typescript
openNow: vibe.filters.includes('open-now'),
```

### `src/types/game.ts` line 29

Replace:
```typescript
export type VibeFilter = 'cheap' | 'mid' | 'treat';
```
With:
```typescript
export type VibeFilter = 'cheap' | 'mid' | 'treat' | 'open-now' | 'near-me' | 'nearby' | 'short-drive' | 'city-wide' | 'any-distance';
```

### `src/hooks/useGameState.ts` line 21

Change `filters: []` to `filters: ['open-now', 'short-drive']`.

This sets Open Now ON and 5mi chip pre-selected as the default state.

### `src/components/game/VibeScreen.tsx` — Step 1 additions

**Distance chips** — defined as a constant array (added near top of file, inside the component or just before `handleFilterToggle`):

```typescript
const DISTANCE_FILTER_KEYS: VibeFilter[] = ['near-me', 'nearby', 'short-drive', 'city-wide', 'any-distance'];
const DISTANCE_CHIPS: { label: string; filter: VibeFilter }[] = [
  { label: '1 mi', filter: 'near-me' },
  { label: '3 mi', filter: 'nearby' },
  { label: '5 mi', filter: 'short-drive' },
  { label: '10 mi', filter: 'city-wide' },
  { label: '25 mi', filter: 'any-distance' },
];

const handleDistanceSelect = (filter: VibeFilter) => {
  const withoutDist = vibeInput.filters.filter(f => !DISTANCE_FILTER_KEYS.includes(f));
  const alreadySelected = vibeInput.filters.includes(filter);
  onVibeChange({ filters: alreadySelected ? withoutDist : [...withoutDist, filter] });
};
```

**In Step 1 JSX** (`step === 1`, which is the budget+filters step), add two new card blocks **before** the existing budget `<div className="bg-card rounded-2xl p-5 shadow-card mb-4">`:

Distance card:
```tsx
<div className="bg-card rounded-2xl p-5 shadow-card mb-4">
  <p className="text-sm font-semibold mb-3">📍 Distance</p>
  <div className="flex flex-wrap gap-2">
    {DISTANCE_CHIPS.map(({ label, filter }) => {
      const isSelected = vibeInput.filters.includes(filter);
      return (
        <button
          key={filter}
          onClick={() => handleDistanceSelect(filter)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            isSelected
              ? 'gradient-warm text-primary-foreground shadow-glow'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          {label}
        </button>
      );
    })}
  </div>
</div>
```

Open Now toggle card (add `Switch` import from `'@/components/ui/switch'`):
```tsx
<div className="bg-card rounded-2xl p-5 shadow-card mb-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold">Open Now</p>
      <p className="text-xs text-muted-foreground">Only show places open right now</p>
    </div>
    <Switch
      checked={vibeInput.filters.includes('open-now')}
      onCheckedChange={(checked) => {
        const withoutOpenNow = vibeInput.filters.filter(f => f !== 'open-now');
        onVibeChange({ filters: checked ? [...withoutOpenNow, 'open-now'] : withoutOpenNow });
      }}
    />
  </div>
</div>
```

Because `initialVibeInput.filters` includes `'short-drive'`, the 5mi chip appears visually selected by default. Because it also includes `'open-now'`, the Open Now toggle appears checked by default.

The budget card's `MAX_FILTERS` check currently limits filters to 2. Distance and open-now filters must be excluded from this count. The fix: in `handleFilterToggle`, only count filters that are in the `FILTERS` array (budget filters), not distance/open-now tokens. Update `isDisabled` check:
```typescript
const activeBudgetFilters = vibeInput.filters.filter(f => FILTERS.some(fl => fl.id === f));
const isDisabled = !isSelected && activeBudgetFilters.length >= MAX_FILTERS;
```

### `src/pages/Index.tsx` — Open Now empty state

Add state near other useState declarations:
```typescript
const [openNowEmpty, setOpenNowEmpty] = useState(false);
```

In `handleVibeComplete`, after `setFindingSpots(false)` at line 144, before falling through to `startGame()`:
```typescript
if (realSpots.length === 0 && state.vibeInput.filters.includes('open-now')) {
  setOpenNowEmpty(true);
  return;
}
```

Add render block before the `if (state.mode === 'landing')` return (line ~219):
```tsx
if (openNowEmpty) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-6 text-center">
      <div>
        <p className="text-5xl mb-4">😴</p>
        <h2 className="font-display text-xl font-bold mb-2">Nothing open right now nearby</h2>
        <p className="text-sm text-muted-foreground mb-6">Try expanding your search or turning off Open Now</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button variant="outline" onClick={() => {
          setOpenNowEmpty(false);
          const withoutDist = state.vibeInput.filters.filter(f =>
            !['near-me','nearby','short-drive','city-wide','any-distance'].includes(f as string)
          );
          setVibeInput({ filters: [...withoutDist, 'any-distance'] });
          setTimeout(() => void handleVibeComplete(), 50);
        }}>
          Increase Distance
        </Button>
        <Button variant="hero" onClick={() => {
          setOpenNowEmpty(false);
          setVibeInput({ filters: state.vibeInput.filters.filter(f => f !== 'open-now') });
          setTimeout(() => void handleVibeComplete(), 50);
        }}>
          Turn Off Open Now
        </Button>
      </div>
    </div>
  );
}
```

The `setTimeout(..., 50)` gives React one tick to flush the `setVibeInput` state update before re-calling `handleVibeComplete`.

---

## Step 7: Location Fix — Cache Invalidation + Label

### `src/hooks/useSelectedCity.ts`

Add import at top:
```typescript
import { clearPlacesCache } from './usePlacesSearch';
```

In `selectCity` callback (line 107), after `setSelectedCityState(city)`:
```typescript
clearPlacesCache();
```

In `clearCity` callback (line 126), after `setSelectedCityState(null)`:
```typescript
clearPlacesCache();
```

Add `locationLabel` to the return object:
```typescript
const locationLabel = selectedCity
  ? `📍 ${selectedCity.label}`
  : '📍 Richmond, VA';  // Fallback when GPS unavailable and no city selected
```

Return it alongside other values.

### `src/components/game/LandingScreen.tsx`

After line 213 (`<p className="text-muted-foreground text-xs mt-2 text-center">One quick decision, guided by fate.</p>`), add:
```tsx
<p className="text-muted-foreground text-[11px] text-center mt-0.5">
  Searching near: {selectedCity ? selectedCity.label : 'Richmond, VA'}
</p>
```

`selectedCity` is already available from `useSelectedCity()` at line 45.

---

## Step 8: Explorer Bot Badge in Feed

### `src/pages/Feed.tsx`

In `FeedCard`, at line 102, insert the badge **before** `<PostTypeLabel ...>`:

```tsx
{post.is_bot && (
  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground font-medium shrink-0">
    Explorer Bot
  </span>
)}
<PostTypeLabel type={post.post_type} isBot={post.is_bot} subtype={post.post_subtype} />
```

One JSX addition. `post.is_bot` already exists in the `FeedPost` interface (line 22 of `useFeed.ts`) and is fetched in the query.

---

## No New Environment Variables Required

All secrets already configured: `GOOGLE_PLACES_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

---

## Files Created/Modified

**New files (3):**
- `supabase/migrations/[timestamp]_mile_markers.sql`
- `src/hooks/useMileMarkers.ts`
- `src/components/profile/MileMarkersTab.tsx`

**Modified files (10):**
- `supabase/functions/search-places/index.ts` — openNow, business_status filter, radius tokens
- `src/hooks/usePlacesSearch.ts` — export `clearPlacesCache()`, pass `openNow`
- `src/hooks/useSelectedCity.ts` — call `clearPlacesCache()` on city change/clear, export `locationLabel`
- `src/types/game.ts` — extend `VibeFilter` union
- `src/hooks/useGameState.ts` — default filters to `['open-now', 'short-drive']`
- `src/pages/Index.tsx` — wire `awardPoints` for daily_open + spin; open-now empty state
- `src/components/game/VibeScreen.tsx` — distance chips + Open Now toggle + fortune pack Plus fix; fix `isDisabled` budget count
- `src/components/game/LandingScreen.tsx` — "Searching near:" label + fortune pack Plus fix
- `src/components/game/ResultsScreen.tsx` — accept `onAwardPoints` prop, wire save + share
- `src/pages/PublicProfile.tsx` — add Mile Markers tab (owner-only)
- `src/pages/Feed.tsx` — Explorer Bot badge + wire `awardPoints` for like

---

## Post-Deployment Sanity Checklist

**Database:**
- [ ] 4 new tables exist: `mile_markers`, `mile_marker_transactions`, `rewards`, `reward_redemptions`
- [ ] `reward_redemptions` has `request_id uuid UNIQUE` column
- [ ] `award_mile_markers` and `redeem_mile_marker_reward` RPCs visible under Functions
- [ ] 5 seed rewards in `rewards` with `active = true` and correct `quantity_available`
- [ ] 2 bot profiles in `profiles` with `is_bot = true`, `city = 'Richmond'`, `region = 'VA'`

**Mile Markers — Free user:**
- [ ] Profile → "Mile Markers" tab only visible to owner (`isOwner`)
- [ ] Tab shows locked state with "Included with Plus ($5.99/mo)" and upgrade button
- [ ] No toast appears when free user spins, saves, or likes

**Mile Markers — Plus user:**
- [ ] Tab shows balance (starts 0), empty transaction history, rewards grid
- [ ] Spin → "+2 Mile Markers 🏁" toast
- [ ] Save a spin → "+3 Mile Markers 🏁" toast
- [ ] Like a post → "+1 Mile Markers 🏁" toast
- [ ] Share → "+5 Mile Markers 🏁" toast
- [ ] First open of the day → "+5 Mile Markers 🏁" from daily_open
- [ ] Open app again same day → NO second daily_open (RPC blocked it)
- [ ] Transaction history shows correct reason labels + timestamps
- [ ] Reward with `quantity_available = 0` shows "Out of stock", button disabled
- [ ] Reward with insufficient balance shows "Need N more pts", button disabled
- [ ] Redeem with sufficient balance → code shown, balance deducted, `quantity_available` decrements

**Fortune Packs:**
- [ ] Plus user: all premium packs show "Included ✓" in VibeScreen and LandingScreen — no lock icon
- [ ] Free user: pack-tier packs show "$2.99" and open `PackPurchaseModal` → Stripe checkout

**Open Now Toggle:**
- [ ] VibeScreen Step 1 shows "Open Now" toggle — pre-checked (ON by default)
- [ ] "📍 Distance" row shows 5 chips — "5 mi" chip pre-highlighted
- [ ] Network request to `search-places` includes `openNow: true` when toggle is ON
- [ ] Closed businesses (`CLOSED_TEMPORARILY` / `PERMANENTLY_CLOSED`) never in results
- [ ] 0 results + Open Now ON → "Nothing open right now nearby" empty state appears
- [ ] "Increase Distance" removes current distance filter, adds `any-distance`, re-spins
- [ ] "Turn Off Open Now" removes `open-now` filter, re-spins — no page refresh

**Distance Chips:**
- [ ] "5 mi" chip is visually pre-highlighted on VibeScreen Step 1
- [ ] Selecting a different chip deselects "5 mi"
- [ ] Network request `radius` changes per selected chip (verify in browser network tab)
- [ ] Budget filter selection still works (max 2 budget filters, independently of distance/open-now)

**Location:**
- [ ] "Searching near: Richmond, VA" (or selected city) appears below spin button on LandingScreen
- [ ] Change city → label updates immediately + cache clears
- [ ] Spin after city change → network request shows new lat/lng (no page refresh needed)
- [ ] If no city selected and no GPS → label shows "Richmond, VA" (not "Your Location")

**Bot Feed Badge:**
- [ ] Feed cards from bot profiles show "Explorer Bot" badge next to display name
- [ ] Badge is small, secondary-colored — visually subtle
- [ ] Bot posts appear in Richmond feed after seeding + `generate-bot-posts` function runs
- [ ] Bot card layout identical to user posts (no layout shift)
