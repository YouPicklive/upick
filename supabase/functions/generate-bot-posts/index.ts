import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Bot handles per city pattern
function makeBotName(cityName: string): string {
  return `YouPick ${cityName}`;
}

// Preset avatars
const PRESET_AVATARS = [
  "cool-cat.png",
  "happy-ghost.png",
  "friendly-mushroom.png",
  "smiling-star.png",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Caption pools ──

const DAILY_PROMPT_TITLES = [
  "Today's vibe in {city} ✨",
  "What's the move, {city}?",
  "{city}, what are we doing today?",
  "Good morning, {city} 🌅",
  "Let {city} surprise you today",
  "{city} is calling — are you listening?",
];

const DAILY_PROMPT_CAPTIONS = [
  "Tap Spin and let the universe decide 🎯",
  "Save 2 options and pick later — no pressure.",
  "Open the app, close your eyes, and trust the spin.",
  "Your next favorite spot is one tap away ✨",
  "Don't overthink it. Just spin.",
  "Today is a good day to discover something new.",
];

const NEARBY_CAPTIONS: Record<string, string[]> = {
  restaurant: [
    "This spot never misses. Incredible flavors every time.",
    "Came for the vibes, stayed for the food. 10/10.",
    "The menu here is chef's kiss 🤌",
    "First time here and I'm already planning my next visit.",
  ],
  cafe: [
    "Perfect coffee spot. The latte art alone is worth it ☕",
    "Found my new favorite study spot. Quiet and cozy.",
    "Rainy day + good coffee = everything I needed.",
  ],
  bar: [
    "This cocktail menu is next level 🍸",
    "Best happy hour in town, don't sleep on this spot.",
    "The bartender recommended something off-menu and it was incredible.",
  ],
  activity: [
    "Didn't expect this to be so fun. Highly recommend!",
    "Perfect way to spend the afternoon. No regrets.",
    "This is what weekends are made for 🌿",
  ],
  wellness: [
    "Treating myself today. This is exactly what I needed 🧖",
    "Left feeling like a completely different person. So relaxed.",
  ],
  nightlife: [
    "The energy in here tonight is unreal 🎶",
    "Spontaneous night out = best night out.",
  ],
  default: [
    "YouPick brought me here and I'm not mad about it ✨",
    "Letting fate decide was the best decision I made today.",
    "Trusted the spin and it delivered. Again.",
  ],
};

function getNearbyCaption(category: string): string {
  const pool = NEARBY_CAPTIONS[category] || NEARBY_CAPTIONS.default;
  return pickRandom(pool);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate caller is admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await authClient.auth.getClaims(token);
      const userId = claimsData?.claims?.sub as string | undefined;
      if (userId) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleData) {
          return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }
    // Allow unauthenticated calls (for cron) — restrict via config if needed

    // ── 1. Get all active cities (popular + recently selected) ──
    const { data: cities, error: citiesErr } = await supabase
      .from("cities")
      .select("*")
      .eq("is_popular", true);

    if (citiesErr || !cities || cities.length === 0) {
      return new Response(JSON.stringify({ error: "No active cities found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalGenerated = 0;

    for (const city of cities) {
      const cityLabel = `${city.name}, ${city.state || ""}`.trim();
      const botName = makeBotName(city.name);
      const avatarFile = pickRandom(PRESET_AVATARS);
      const avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/presets/${avatarFile}`;

      // ── 2. Check how many non-expired posts exist today ──
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count: existingCount } = await supabase
        .from("feed_posts")
        .select("id", { count: "exact", head: true })
        .eq("city_id", city.id)
        .eq("is_bot", true)
        .gte("created_at", todayStart.toISOString());

      // Skip if already has 10+ posts today
      if ((existingCount || 0) >= 10) continue;

      const posts: any[] = [];

      // ── 3. Daily prompt (1 per city) ──
      const promptTitle = pickRandom(DAILY_PROMPT_TITLES).replace("{city}", city.name);
      const promptCaption = pickRandom(DAILY_PROMPT_CAPTIONS);

      posts.push({
        post_type: "bot",
        post_subtype: "daily_prompt",
        title: promptTitle,
        body: promptCaption,
        result_name: city.name,
        result_category: null,
        lat: city.lat,
        lng: city.lng,
        city: city.name,
        city_id: city.id,
        region: city.state,
        is_anonymous: false,
        is_bot: true,
        bot_display_name: botName,
        bot_avatar_url: avatarUrl,
        visibility: "public",
        created_at: new Date().toISOString(),
        expires_at: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: { type: "daily_prompt" },
      });

      // ── 4. Nearby activity posts (2-5 from businesses) ──
      const { data: businesses } = await supabase
        .from("businesses")
        .select("name, category, neighborhood, latitude, longitude, city, state, description")
        .eq("active", true)
        .eq("city", city.name);

      if (businesses && businesses.length > 0) {
        // Get existing place names posted today to avoid duplicates
        const { data: todayPosts } = await supabase
          .from("feed_posts")
          .select("result_name")
          .eq("city_id", city.id)
          .eq("is_bot", true)
          .gte("created_at", todayStart.toISOString());

        const usedNames = new Set((todayPosts || []).map((p: any) => p.result_name));

        const available = businesses.filter((b: any) => !usedNames.has(b.name));
        const shuffled = available.sort(() => Math.random() - 0.5);
        const nearbyCount = Math.min(2 + Math.floor(Math.random() * 4), shuffled.length);

        for (let i = 0; i < nearbyCount; i++) {
          const biz = shuffled[i];
          const caption = getNearbyCaption(biz.category);
          const hoursAgo = i * 2 + Math.floor(Math.random() * 2);

          posts.push({
            post_type: "bot",
            post_subtype: "nearby_activity",
            title: `${botName} spotted ${biz.name} 📍`,
            body: caption,
            result_name: biz.name,
            result_category: biz.category,
            lat: biz.latitude,
            lng: biz.longitude,
            city: city.name,
            city_id: city.id,
            region: city.state || biz.state,
            is_anonymous: false,
            is_bot: true,
            bot_display_name: botName,
            bot_avatar_url: avatarUrl,
            visibility: "public",
            created_at: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
            expires_at: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            metadata: { type: "nearby_activity", category: biz.category, neighborhood: biz.neighborhood },
          });
        }
      }

      // ── 5. Insert all posts for this city ──
      if (posts.length > 0) {
        const { error: insertErr } = await supabase.from("feed_posts").insert(posts);
        if (insertErr) {
          console.error(`Insert error for ${cityLabel}:`, insertErr);
        } else {
          totalGenerated += posts.length;
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, generated: totalGenerated, cities: cities.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
