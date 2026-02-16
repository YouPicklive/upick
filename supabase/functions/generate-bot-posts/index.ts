import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BOT_NAMES = [
  "Alex", "Mia", "Jordan", "Taylor", "Sam",
  "Casey", "Riley", "Drew", "Jamie", "Morgan",
  "Ava", "Liam", "Zoe", "Kai", "Nina",
  "Eli", "Luna", "Ren", "Sage", "Ivy",
];

const CAPTIONS: Record<string, string[]> = {
  restaurant: [
    "This spot never misses. Incredible flavors every time.",
    "Came for the vibes, stayed for the food. 10/10.",
    "The menu here is chef's kiss 🤌",
    "Didn't know I needed this in my life until now.",
    "Cozy atmosphere + amazing food = perfect evening.",
    "First time here and I'm already planning my next visit.",
  ],
  cafe: [
    "Perfect coffee spot. The latte art alone is worth it ☕",
    "Found my new favorite study spot. Quiet and cozy.",
    "The pour-over here is something special.",
    "Rainy day + good coffee = everything I needed.",
  ],
  bar: [
    "This cocktail menu is next level 🍸",
    "Incredible tap list. Trying the flight was the right call.",
    "Best happy hour in town, don't sleep on this spot.",
    "The bartender recommended something off-menu and it was incredible.",
  ],
  activity: [
    "Didn't expect this to be so fun. Highly recommend!",
    "Perfect way to spend the afternoon. No regrets.",
    "This is what weekends are made for 🌿",
    "Added to my must-do-again list immediately.",
  ],
  wellness: [
    "Treating myself today. This is exactly what I needed 🧖",
    "Left feeling like a completely different person. So relaxed.",
    "Self-care isn't optional, it's essential. This place gets it.",
  ],
  brunch: [
    "Weekend brunch sorted. Every dish was incredible 🥞",
    "The mimosas alone are worth the trip.",
    "Got here right at opening — no line, perfect timing.",
  ],
  nightlife: [
    "The energy in here tonight is unreal 🎶",
    "Best live music venue in RVA, no debate.",
    "Spontaneous night out = best night out.",
  ],
  desserts: [
    "I don't even have a sweet tooth but WOW 🍰",
    "This place is dangerously good. Going back tomorrow.",
    "The perfect ending to a perfect day.",
  ],
  default: [
    "YouPick brought me here and I'm not mad about it ✨",
    "Letting fate decide was the best decision I made today.",
    "This app really gets me. Another perfect pick 🎯",
    "Trusted the spin and it delivered. Again.",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getCaption(category: string): string {
  const pool = CAPTIONS[category] || CAPTIONS.default;
  // 30% chance to also append a default caption flavor
  if (Math.random() < 0.3) {
    return pickRandom(pool) + " " + pickRandom(CAPTIONS.default);
  }
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

    // Get active businesses
    const { data: businesses, error: bizErr } = await supabase
      .from("businesses")
      .select("name, category, neighborhood, latitude, longitude")
      .eq("active", true);

    if (bizErr || !businesses || businesses.length === 0) {
      return new Response(JSON.stringify({ error: "No businesses found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 5-8 posts with staggered timestamps
    const numPosts = 5 + Math.floor(Math.random() * 4);
    const posts = [];

    const usedBusinesses = new Set<string>();
    const usedNames = new Set<string>();

    for (let i = 0; i < numPosts; i++) {
      // Pick unique business
      let biz;
      let attempts = 0;
      do {
        biz = pickRandom(businesses);
        attempts++;
      } while (usedBusinesses.has(biz.name) && attempts < 20);
      usedBusinesses.add(biz.name);

      // Pick unique bot name
      let botName;
      do {
        botName = pickRandom(BOT_NAMES);
      } while (usedNames.has(botName) && usedNames.size < BOT_NAMES.length);
      usedNames.add(botName);

      const caption = getCaption(biz.category);
      const hoursAgo = i * 4 + Math.floor(Math.random() * 3);

      posts.push({
        post_type: "spin_result",
        title: `${botName} landed on ${biz.name} 🎯`,
        body: caption,
        result_name: biz.name,
        result_category: biz.category,
        lat: biz.latitude,
        lng: biz.longitude,
        city: "Richmond",
        region: "VA",
        is_anonymous: false,
        is_bot: true,
        bot_display_name: botName,
        visibility: "public",
        created_at: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      });
    }

    const { error: insertErr } = await supabase
      .from("feed_posts")
      .insert(posts);

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, generated: posts.length }),
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
