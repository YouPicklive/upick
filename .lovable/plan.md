
# YouPick.live — Profiles, Free Allowance, Plus Subscription (End-to-End)

## Summary

This plan wires up a complete membership system: database-backed profiles, server-enforced spin limits, Stripe-powered Plus subscriptions (checkout + portal + webhook), and new UI pages for Profile, Membership, and Saved Fortunes.

**Non-negotiable**: All existing Fortune UI, Fortune Packs, and game flow remain untouched. We only add gating wrappers and new pages.

---

## What Already Exists (No Changes Needed)

- Auth page (`/auth`) with email, Google, Apple login
- `user_entitlements` table with `plus_active`, `owned_packs`
- `useAuth`, `useFreemium`, `useUserEntitlements` hooks
- `check-subscription` edge function (Stripe lookup)
- `stripe-webhook` edge function (checkout.session.completed, subscription.deleted)
- `create-pack-checkout` edge function
- Fortune packs UI (LandingScreen, PackPurchaseModal, ResultsScreen)
- SpinLimitModal

---

## Phase 1: Database Changes

### A) Create `profiles` table

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  username text UNIQUE,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

### B) Add spin tracking columns to `user_entitlements`

```sql
ALTER TABLE public.user_entitlements
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS unlimited_spins boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_save_fortunes boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_spin_limit_per_day int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS spins_used_today int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spins_reset_date date NOT NULL DEFAULT CURRENT_DATE;
```

### C) Create `saved_fortunes` table

```sql
CREATE TABLE public.saved_fortunes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fortune_pack_id text,
  fortune_text text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_fortunes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved fortunes"
  ON public.saved_fortunes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved fortunes"
  ON public.saved_fortunes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saved fortunes"
  ON public.saved_fortunes FOR DELETE TO authenticated
  USING (user_id = auth.uid());
```

### D) Create `stripe_customers` table

```sql
CREATE TABLE public.stripe_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stripe customer"
  ON public.stripe_customers FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

### E) Create `stripe_subscriptions` table

```sql
CREATE TABLE public.stripe_subscriptions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  status text NOT NULL,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stripe_subscription_id)
);

ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.stripe_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

### F) Auto-create profile + entitlements on signup

Update the existing `handle_new_user_entitlements` trigger function to also create a profile row:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- Create entitlements
  INSERT INTO public.user_entitlements (
    user_id, plus_active, owned_packs, tier,
    unlimited_spins, can_save_fortunes,
    free_spin_limit_per_day, spins_used_today, spins_reset_date
  )
  VALUES (
    NEW.id, false, '{}', 'free',
    false, false, 1, 0, CURRENT_DATE
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
```

Ensure the trigger is attached:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_entitlements();
```

### G) Create `check_and_consume_spin` database function

```sql
CREATE OR REPLACE FUNCTION public.check_and_consume_spin(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
  v_unlimited boolean;
  v_limit int;
  v_used int;
  v_reset_date date;
BEGIN
  SELECT tier, unlimited_spins, free_spin_limit_per_day,
         spins_used_today, spins_reset_date
  INTO v_tier, v_unlimited, v_limit, v_used, v_reset_date
  FROM public.user_entitlements
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_entitlements');
  END IF;

  -- Plus or unlimited
  IF v_tier = 'plus' OR v_unlimited THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'plus');
  END IF;

  -- Reset if new day
  IF v_reset_date != CURRENT_DATE THEN
    v_used := 0;
    UPDATE public.user_entitlements
    SET spins_used_today = 0, spins_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
  END IF;

  -- Check limit
  IF v_used >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'limit_reached',
      'used', v_used, 'limit', v_limit);
  END IF;

  -- Consume spin
  UPDATE public.user_entitlements
  SET spins_used_today = spins_used_today + 1
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('allowed', true, 'reason', 'free_remaining',
    'remaining', v_limit - v_used - 1);
END;
$$;
```

---

## Phase 2: Edge Functions

### A) `create-checkout` (Plus subscription checkout)

New edge function at `supabase/functions/create-checkout/index.ts`:

- Auth required (reads JWT)
- Looks up or creates Stripe customer (stores in `stripe_customers`)
- Creates `mode: 'subscription'` checkout session with the existing Plus price ID
- Passes `metadata: { user_id }` for webhook mapping
- Returns checkout URL

### B) `customer-portal` (Manage/Cancel)

New edge function at `supabase/functions/customer-portal/index.ts`:

- Auth required
- Looks up `stripe_customers` for `stripe_customer_id`
- Creates Stripe Billing Portal session
- Returns portal URL

### C) Update `stripe-webhook`

Expand the existing webhook to handle additional events:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted` (already handled)

On each subscription event:
1. Resolve `user_id` from metadata or `stripe_customers` table
2. Upsert into `stripe_subscriptions`
3. Update `user_entitlements`:
   - Active/trialing: set `tier='plus'`, `unlimited_spins=true`, `can_save_fortunes=true`
   - Canceled/unpaid/deleted: set `tier='free'`, `unlimited_spins=false`, `can_save_fortunes=false`
4. Also upsert `stripe_customers` if not already stored

### D) Update `check-subscription`

Enhance to return the new entitlements fields (`tier`, `unlimited_spins`, `can_save_fortunes`, `spins_used_today`, `free_spin_limit_per_day`).

---

## Phase 3: Frontend Hooks

### A) Refactor `useFreemium`

Replace localStorage spin tracking with server-side `check_and_consume_spin` RPC call for authenticated users. Keep localStorage as guest-only fallback.

Key changes:
- `useSpin()` calls `supabase.rpc('check_and_consume_spin', { p_user_id: user.id })` for authenticated users
- Returns `{ allowed, reason, remaining }` from server
- If `reason === 'limit_reached'`, show SpinLimitModal

### B) Refactor `useUserEntitlements`

Read the new columns (`tier`, `unlimited_spins`, `can_save_fortunes`, `spins_used_today`, `free_spin_limit_per_day`) from `user_entitlements`.

### C) New hook: `useProfile`

- Fetches/updates `profiles` table
- Provides `profile`, `updateProfile()`, `loading`

### D) New hook: `useSavedFortunes`

- CRUD on `saved_fortunes` table
- Provides `savedFortunes`, `saveFortune()`, `deleteFortune()`, `loading`

---

## Phase 4: New Pages

### A) `/profile`

Edit display name, username, avatar URL. Simple form backed by `useProfile`.

### B) `/membership`

- Shows current tier (Free / Plus) with visual distinction
- If Free: upgrade CTA button that calls `create-checkout` edge function
- If Plus: "Manage Billing" button that calls `customer-portal` edge function
- Shows subscription end date if applicable
- Shows owned fortune packs

### C) `/saved`

- Plus-only page
- If free user: show upsell card with upgrade CTA
- If Plus: list saved fortunes with delete option
- Fortune saving triggered from ResultsScreen (add "Save Fortune" button for Plus users)

---

## Phase 5: UI Gating Integration

### A) Fortune Packs gating

Already works via RLS. No code changes needed. Lock icons already display correctly.

### B) Save Fortune button on ResultsScreen

Add a heart/bookmark icon button next to the fortune text:
- If `can_save_fortunes`: save to `saved_fortunes`
- If not: show upgrade modal

### C) Spin gating (server-enforced)

Replace the client-side spin check in `Index.tsx`:
- Before spinning, call `check_and_consume_spin` via RPC
- If `allowed: false`, show SpinLimitModal
- If `allowed: true`, proceed with spin

### D) Navigation updates

Add profile/membership links to the header in `LandingScreen.tsx`:
- User avatar/name links to `/profile`
- "Plus" badge or "Upgrade" button links to `/membership`

---

## Phase 6: Route Registration

Add new routes in `App.tsx`:

```
/profile    -> Profile page
/membership -> Membership page
/saved      -> Saved Fortunes page
```

---

## Technical Details

### config.toml updates

```toml
[functions.create-checkout]
verify_jwt = false

[functions.customer-portal]
verify_jwt = false
```

(JWT verified manually in the function code for flexibility)

### Stripe Price ID

The existing Plus price ID `price_1SxAyfC3xPeU0PAgoYHXcyEX` ($5.99/mo) will be used in the `create-checkout` function. No new Stripe products needed.

### Migration strategy for existing users

- Existing `user_entitlements` rows get default values for new columns (`tier='free'`, `unlimited_spins=false`, etc.)
- Users with `plus_active=true` will need a backfill query:
  ```sql
  UPDATE user_entitlements
  SET tier = 'plus', unlimited_spins = true, can_save_fortunes = true
  WHERE plus_active = true;
  ```

### What stays the same

- All fortune pack display and selection UI
- Fortune wheel animation
- Vibe selection flow
- Playing/swiping cards
- Results screen layout
- Pack purchase modal and Stripe checkout for individual packs
- All existing edge functions continue to work
