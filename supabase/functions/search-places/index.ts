import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  CATEGORY_RULES,
  isValidForCategory,
  applyPreferenceConstraints,
  runFilterPipeline,
  type PlaceCandidate,
} from "../_shared/category-rules.ts";

const SearchPlacesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  intent: z.enum(["food", "drinks", "activity", "shopping", "events", "services", "surprise"]).nullable().optional(),
  energy: z.string().max(50).nullable().optional(),
  filters: z.array(z.string().max(50)).max(20).nullable().optional(),
  shoppingSubcategory: z.enum(["random", "decor", "clothes", "games", "books", "gifts", "vintage", "artisan"]).nullable().optional(),
  selectedVibe: z.string().max(50).nullable().optional(),
  openNow: z.boolean().optional().default(false),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ───────────────────────────────────────────────────────────

function intentToDBCategories(intent: string | null): string[] {
  switch (intent) {
    case "food": return ["restaurant", "cafe", "bakery", "food-truck", "brunch", "lunch", "dinner", "desserts"];
    case "drinks": return ["bar", "nightlife", "cocktail-lounge", "wine-bar", "dive-bar", "rooftop-bar"];
    case "activity": return ["activity", "park", "museum", "bowling", "arcade", "escape-room", "golf", "mini-golf", "hiking", "workshop"];
    case "shopping": return ["shopping", "retail", "boutique", "thrift", "market", "vintage", "mall"];
    case "events": return ["event", "concert", "festival", "live-music", "art-show", "pop-up", "nightlife"];
    case "services": return ["wellness", "spa", "yoga", "fitness", "gym", "meditation", "massage"];
    default: return [];
  }
}

function intentToPlaceTypes(intent: string | null): string[] {
  const rules = CATEGORY_RULES[intent || "surprise"];
  if (!rules) return ["restaurant", "bar", "cafe", "tourist_attraction"];
  return [...rules.allowedTypes].slice(0, 5); // Google allows few types per query
}

// Shopping subcategory → Google Places search config
interface ShoppingSearchConfig { types: string[]; textQueries: string[]; }

function shoppingSubcategoryConfig(sub: string | null | undefined): ShoppingSearchConfig {
  switch (sub) {
    case "decor": return { types: ["home_goods_store", "furniture_store"], textQueries: ["home decor store", "interior design store", "lighting store"] };
    case "clothes": return { types: ["clothing_store", "shoe_store"], textQueries: ["boutique clothing", "fashion store"] };
    case "games": return { types: [], textQueries: ["board game store", "game store", "comic shop", "hobby shop"] };
    case "books": return { types: ["book_store"], textQueries: ["bookstore", "used books"] };
    case "gifts": return { types: [], textQueries: ["gift shop", "novelty shop", "souvenir shop"] };
    case "vintage": return { types: [], textQueries: ["vintage store", "thrift store", "consignment shop", "antique store"] };
    case "artisan": return { types: [], textQueries: ["local artisan shop", "gallery shop", "makers market", "craft store"] };
    default: return { types: ["shopping_mall", "department_store", "clothing_store"], textQueries: ["boutique", "shop"] };
  }
}

// Subcategory-specific ALLOWED Google Place types
const SHOPPING_ALLOWED_TYPES: Record<string, Set<string>> = {
  decor: new Set(["home_goods_store", "furniture_store", "home_improvement_store", "art_gallery", "lighting_store", "store"]),
  clothes: new Set(["clothing_store", "shoe_store", "jewelry_store", "store"]),
  games: new Set(["store", "book_store"]),
  books: new Set(["book_store", "library", "store"]),
  gifts: new Set(["store", "jewelry_store"]),
  vintage: new Set(["store", "clothing_store", "furniture_store", "home_goods_store"]),
  artisan: new Set(["store", "art_gallery", "jewelry_store"]),
};

function mapPriceLevel(priceLevel?: number): 1 | 2 | 3 | 4 {
  if (priceLevel === undefined || priceLevel === null) return 2;
  if (priceLevel <= 1) return 1;
  if (priceLevel === 2) return 2;
  if (priceLevel === 3) return 3;
  return 4;
}

function mapPriceLevelFromString(pl?: string): 1 | 2 | 3 | 4 {
  switch (pl) {
    case "$": return 1; case "$$": return 2; case "$$$": return 3; case "$$$$": return 4; default: return 2;
  }
}

function googlePriceToAppLabel(priceLevel?: number): string {
  if (priceLevel === undefined || priceLevel === null) return "Price unknown";
  if (priceLevel <= 1) return "$";
  if (priceLevel === 2) return "$$";
  if (priceLevel === 3) return "$$$";
  return "$$$$";
}

function matchesPriceFilter(priceLevel: number | undefined | null, filters?: string[]): boolean {
  if (!filters) return true;
  const hasCheap = filters.includes("cheap");
  const hasMid = filters.includes("mid");
  const hasTreat = filters.includes("treat");
  if (!hasCheap && !hasMid && !hasTreat) return true;
  if (priceLevel === undefined || priceLevel === null) return hasCheap ? false : true;
  if (hasCheap && priceLevel <= 1) return true;
  if (hasMid && priceLevel >= 1 && priceLevel <= 3) return true;
  if (hasTreat && priceLevel >= 3) return true;
  return false;
}

function mapCategory(types: string[]): string {
  if (types.some(t => ["bar", "night_club"].includes(t))) return "bar";
  if (types.some(t => ["shopping_mall", "store", "clothing_store", "shoe_store", "jewelry_store", "book_store", "home_goods_store", "furniture_store", "electronics_store", "department_store"].includes(t))) return "shopping";
  if (types.some(t => ["spa", "physiotherapist", "gym", "yoga_studio", "beauty_salon"].includes(t))) return "wellness";
  if (types.some(t => ["cafe", "bakery"].includes(t))) return "cafe";
  if (types.some(t => ["amusement_park", "bowling_alley", "movie_theater", "museum", "park", "tourist_attraction", "stadium", "zoo", "aquarium", "campground", "hiking_area", "art_gallery"].includes(t))) return "activity";
  return "restaurant";
}

function inferVibeLevel(types: string[], _rating?: number): string {
  if (types.some(t => ["night_club"].includes(t))) return "dancing";
  if (types.some(t => ["bar", "bowling_alley", "amusement_park", "gym", "stadium"].includes(t))) return "active";
  if (types.some(t => ["spa", "park", "museum", "cafe", "bakery"].includes(t))) return "chill";
  return "moderate";
}

function extractNeighborhood(formattedAddress?: string): string {
  if (!formattedAddress) return "Nearby";
  const parts = formattedAddress.split(",").map(p => p.trim());
  return parts[1] || parts[0] || "Nearby";
}

function mapEnergyToVibeLevel(energy?: string): string {
  switch (energy) {
    case "chill": return "chill"; case "moderate": return "moderate"; case "hype": return "active"; default: return "moderate";
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMaxRadiusMiles(filters?: string[]): number {
  if (!filters) return 15;
  if (filters.includes("near-me")) return 1;
  if (filters.includes("nearby")) return 3;
  if (filters.includes("short-drive")) return 5;
  if (filters.includes("city-wide")) return 10;
  if (filters.includes("any-distance")) return 45;
  return 15;
}

function getGoogleRadiusMeters(filters?: string[], intent?: string | null): number {
  if (filters?.includes("near-me")) return 1600;       // ~1 mi
  if (filters?.includes("nearby")) return 4800;         // ~3 mi
  if (filters?.includes("short-drive")) return 8000;    // ~5 mi (default chip)
  if (filters?.includes("city-wide")) return 16000;     // ~10 mi
  if (filters?.includes("any-distance")) return 40000;  // ~25 mi
  if (intent === "events") return 8000;
  return 5000; // unchanged fallback
}

// ── Google API ────────────────────────────────────────────────────────

async function googleNearbySearch(
  apiKey: string, lat: number, lng: number, radius: number, type: string,
  minPrice?: number, maxPrice?: number, openNow?: boolean
): Promise<any[]> {
  const params = new URLSearchParams({
    location: `${lat},${lng}`, radius: String(radius), type, key: apiKey,
  });
  if (minPrice !== undefined) params.set("minprice", String(minPrice));
  if (maxPrice !== undefined) params.set("maxprice", String(maxPrice));
  if (openNow) params.append("opennow", "");
  const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`);
  const data = await res.json();
  return data.results || [];
}

async function googleTextSearch(
  apiKey: string, query: string, lat: number, lng: number, radius: number
): Promise<any[]> {
  const params = new URLSearchParams({
    query, location: `${lat},${lng}`, radius: String(radius), key: apiKey,
  });
  const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`);
  const data = await res.json();
  return data.results || [];
}

// ── Photo caching helpers ─────────────────────────────────────────────

async function getCachedPhotos(supabaseUrl: string, serviceKey: string, placeId: string): Promise<string[] | null> {
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data } = await adminClient
    .from("place_photos")
    .select("photo_urls, updated_at")
    .eq("place_id", placeId)
    .maybeSingle();

  if (!data) return null;

  // Check if cache is older than 7 days
  const updatedAt = new Date(data.updated_at);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (updatedAt < sevenDaysAgo) return null;

  return data.photo_urls as string[];
}

async function setCachedPhotos(supabaseUrl: string, serviceKey: string, placeId: string, photoUrls: string[]): Promise<void> {
  const adminClient = createClient(supabaseUrl, serviceKey);
  await adminClient
    .from("place_photos")
    .upsert(
      { place_id: placeId, photo_urls: photoUrls, updated_at: new Date().toISOString() },
      { onConflict: "place_id" }
    );
}

function buildPhotoUrls(photos: any[], apiKey: string, maxWidth: number = 1200): string[] {
  return (photos || [])
    .slice(0, 5)
    .map((p: any) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${p.photo_reference}&key=${apiKey}`);
}

// ── Convert to app Spot format ────────────────────────────────────────

async function googlePlaceToSpot(
  place: any, apiKey: string, idx: number, userLat: number, userLng: number,
  intentOverride?: string, supabaseUrl?: string, serviceKey?: string
): Promise<any> {
  const placeId = place.place_id;
  let photoUrls: string[] = [];

  // Try cache first
  if (placeId && supabaseUrl && serviceKey) {
    try {
      const cached = await getCachedPhotos(supabaseUrl, serviceKey, placeId);
      if (cached && cached.length > 0) {
        photoUrls = cached;
      }
    } catch (_) {}
  }

  // Build from Google data if not cached
  if (photoUrls.length === 0 && place.photos && place.photos.length > 0) {
    photoUrls = buildPhotoUrls(place.photos, apiKey, 1200);
    // Cache asynchronously
    if (placeId && supabaseUrl && serviceKey) {
      setCachedPhotos(supabaseUrl, serviceKey, placeId, photoUrls).catch(() => {});
    }
  }

  const image = photoUrls[0] || "";
  const lat = place.geometry?.location?.lat;
  const lng = place.geometry?.location?.lng;
  const distance = (lat && lng) ? Math.round(haversineDistance(userLat, userLng, lat, lng) * 10) / 10 : undefined;
  const types = place.types || [];
  const category = intentOverride || mapCategory(types);
  const typeLabels = types
    .filter((t: string) => !["point_of_interest", "establishment"].includes(t))
    .slice(0, 2)
    .map((t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()));

  return {
    id: placeId || `place-${idx}`,
    name: place.name,
    category,
    description: place.vicinity || place.formatted_address || typeLabels.join(", ") || "A great spot nearby",
    priceLevel: mapPriceLevel(place.price_level),
    priceLabelOverride: googlePriceToAppLabel(place.price_level),
    rating: place.rating || 4.0,
    image,
    photoUrls,
    tags: types
      .filter((t: string) => !["point_of_interest", "establishment"].includes(t))
      .slice(0, 3)
      .map((t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())),
    neighborhood: extractNeighborhood(place.vicinity || place.formatted_address),
    isOutdoor: types.some((t: string) => ["park", "campground", "stadium", "hiking_area"].includes(t)),
    smokingFriendly: false,
    vibeLevel: inferVibeLevel(types, place.rating),
    plusOnly: false,
    latitude: lat,
    longitude: lng,
    distance,
    placeId,
  };
}

// ── Events-specific text queries ──────────────────────────────────────

const EVENT_TEXT_QUERIES_TIER1 = [
  "concert near me", "live music tonight", "comedy show",
  "theater performance", "festival", "art show",
  "market pop-up", "exhibition", "workshop class",
];
const EVENT_TEXT_QUERIES_TIER2 = [
  "brewery live music trivia", "bar karaoke DJ",
  "yoga fitness class", "museum gallery", "event venue",
];

// ── Main handler ──────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const parsed = SearchPlacesSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { latitude, longitude, intent, energy, filters, shoppingSubcategory, openNow } = parsed.data;
    const effectiveIntent = intent || "surprise";
    const filterArr = filters || [];
    const maxMiles = getMaxRadiusMiles(filterArr);
    const googleRadius = getGoogleRadiusMeters(filterArr, intent);

    // ========== SHOPPING SUBCATEGORY PATH ==========
    if (intent === "shopping" && shoppingSubcategory) {
      const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Google Places API key not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const config = shoppingSubcategoryConfig(shoppingSubcategory);
      const radiusSteps = [3000, 8000, 15000];
      const seenPlaceIds = new Set<string>();
      let allRawResults: any[] = [];
      const subKey = shoppingSubcategory || "random";
      const allowed = SHOPPING_ALLOWED_TYPES[subKey];

      for (const radiusM of radiusSteps) {
        for (const type of config.types) {
          if (allRawResults.length >= 20) break;
          const results = await googleNearbySearch(apiKey, latitude, longitude, radiusM, type);
          for (const r of results) {
            if (!seenPlaceIds.has(r.place_id)) {
              seenPlaceIds.add(r.place_id);
              allRawResults.push(r);
            }
          }
        }
        if (allRawResults.length < 20) {
          for (const query of config.textQueries) {
            if (allRawResults.length >= 20) break;
            const results = await googleTextSearch(apiKey, query, latitude, longitude, radiusM);
            for (const r of results) {
              if (!seenPlaceIds.has(r.place_id)) {
                seenPlaceIds.add(r.place_id);
                allRawResults.push(r);
              }
            }
          }
        }
        if (allRawResults.length >= 10) break;
      }

      // Fallback broad search
      if (allRawResults.length === 0) {
        const fallbackQuery = subKey === "random" ? "shop" : `${subKey} store`;
        const broadResults = await googleTextSearch(apiKey, fallbackQuery, latitude, longitude, 15000);
        for (const r of broadResults) {
          if (!seenPlaceIds.has(r.place_id)) {
            seenPlaceIds.add(r.place_id);
            allRawResults.push(r);
          }
        }
      }

      // Run through unified pipeline for "shopping" category
      const pipelineResults = runFilterPipeline(
        allRawResults.map(r => ({
          ...r,
          types: r.types || [],
          name: r.name || "",
        })),
        "shopping",
        filterArr,
        8,
        2
      );

      // Additional subcategory filter: require allowed types for specific subcategories
      let finalResults = pipelineResults;
      if (allowed) {
        finalResults = pipelineResults.filter(p =>
          (p.types || []).some(t => allowed.has(t)) || finalResults.length < 4
        );
        if (finalResults.length < 4) finalResults = pipelineResults; // fallback
      }

      const serviceKeySh = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const sbUrlSh = Deno.env.get("SUPABASE_URL")!;
      const spots = await Promise.all(
        finalResults
          .filter(p => matchesPriceFilter(p.price_level ?? undefined, filterArr))
          .slice(0, 10)
          .map((place, idx) => googlePlaceToSpot(place, apiKey, idx, latitude, longitude, "shopping", sbUrlSh, serviceKeySh || undefined))
      );

      return new Response(JSON.stringify({ spots, source: "google-shopping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== STANDARD PATH ==========

    // --- Step 1: Try curated businesses table first ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const dbCategories = intentToDBCategories(intent);
    let query = supabase.from("businesses").select("*").eq("active", true);

    if (dbCategories.length > 0) {
      query = query.in("category", dbCategories);
    }

    if (filterArr.includes("cheap")) {
      query = query.in("price_level", ["$"]);
    } else if (filterArr.includes("mid")) {
      query = query.in("price_level", ["$$"]);
    } else if (filterArr.includes("treat")) {
      query = query.in("price_level", ["$$$", "$$$$"]);
    }

    if (energy) {
      const energyMap: Record<string, string[]> = {
        chill: ["chill"], social: ["moderate", "hype"], romantic: ["chill", "moderate"],
        adventure: ["hype"], productive: ["chill"], "self-care": ["chill"], weird: ["hype", "moderate"],
      };
      const energyValues = energyMap[energy];
      if (energyValues) query = query.in("energy", energyValues);
    }

    query = query.limit(100);
    const { data: dbSpots, error: dbError } = await query;

    if (!dbError && dbSpots && dbSpots.length > 0) {
      const withDistance = dbSpots
        .filter((b: any) => b.latitude && b.longitude)
        .map((b: any) => ({
          ...b,
          _distance: haversineDistance(latitude, longitude, b.latitude, b.longitude),
        }))
        .filter((b: any) => b._distance <= maxMiles)
        .sort((a: any, b: any) => a._distance - b._distance);

      if (withDistance.length > 0) {
        const hasPriceFilter = filterArr.includes("cheap") || filterArr.includes("mid") || filterArr.includes("treat");
        const priceFiltered = hasPriceFilter
          ? withDistance.filter((b: any) => b.price_level !== null)
          : withDistance;

        if (priceFiltered.length === 0) {
          return new Response(JSON.stringify({
            spots: [], source: "curated",
            message: "Nothing aligned here yet — try expanding your radius or adjusting price.",
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const selected = priceFiltered.slice(0, 20).sort(() => Math.random() - 0.5).slice(0, 10);
        const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

        const spots = await Promise.all(
          selected.map(async (b: any) => {
            let image = b.photo_url || "";
            let description = b.description || "";

            if (apiKey && (!image || !description)) {
              try {
                const q = `${b.name} ${b.city || ""}`.trim();
                const locationBias = b.latitude && b.longitude ? `&locationbias=point:${b.latitude},${b.longitude}` : "";
                const fields = ["photos", !description ? "formatted_address" : ""].filter(Boolean).join(",");
                const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(q)}&inputtype=textquery&fields=place_id,${fields}${locationBias}&key=${apiKey}`;
                const findRes = await fetch(findUrl);
                const findData = await findRes.json();
                const candidate = findData.candidates?.[0];
                if (candidate) {
                  if (!image && candidate.photos?.[0]?.photo_reference) {
                    const ref = candidate.photos[0].photo_reference;
                    image = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${ref}&key=${apiKey}`;
                    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
                    if (serviceKey) {
                      const adminClient = createClient(supabaseUrl, serviceKey);
                      adminClient.from("businesses").update({ photo_url: image }).eq("id", b.id).then(() => {});
                    }
                  }
                  if (!description && candidate.formatted_address) description = candidate.formatted_address;
                }
              } catch (e) {
                console.error(`Google enrichment failed for ${b.name}:`, e);
              }
            }

            return {
              id: b.id, name: b.name, category: b.category,
              description: description || "A great spot nearby",
              priceLevel: mapPriceLevelFromString(b.price_level),
              rating: b.rating ? Number(b.rating) : 4.0,
              image,
              tags: b.tags || [],
              neighborhood: b.neighborhood || b.city || "Nearby",
              isOutdoor: b.is_outdoor ?? false,
              smokingFriendly: b.smoking_friendly ?? false,
              vibeLevel: mapEnergyToVibeLevel(b.energy),
              plusOnly: false,
              latitude: b.latitude, longitude: b.longitude,
              distance: Math.round(b._distance * 10) / 10,
            };
          })
        );

        return new Response(JSON.stringify({ spots, source: "curated" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // --- Step 2: Fall back to Google Places API ---
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No businesses found and Google Places API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isFreePrice = filterArr.includes("cheap");

    // ========== EVENTS PATH ==========
    if (intent === "events") {
      let radius = googleRadius;
      const seenIds = new Set<string>();
      const allRawResults: any[] = [];

      // Tier 1: Scheduled events
      for (const q of EVENT_TEXT_QUERIES_TIER1) {
        if (allRawResults.length >= 20) break;
        const results = await googleTextSearch(apiKey, q, latitude, longitude, radius);
        for (const place of results) {
          if (!seenIds.has(place.place_id)) {
            seenIds.add(place.place_id);
            allRawResults.push(place);
          }
        }
      }

      // Tier 2: Businesses hosting events
      if (allRawResults.length < 15) {
        for (const q of EVENT_TEXT_QUERIES_TIER2) {
          if (allRawResults.length >= 20) break;
          const results = await googleTextSearch(apiKey, q, latitude, longitude, radius);
          for (const place of results) {
            if (!seenIds.has(place.place_id)) {
              seenIds.add(place.place_id);
              allRawResults.push(place);
            }
          }
        }
      }

      // Failsafe: expand radius
      if (allRawResults.length === 0) {
        const expandedRadius = Math.min(radius * 3, 50000);
        for (const q of EVENT_TEXT_QUERIES_TIER1.slice(0, 3)) {
          const results = await googleTextSearch(apiKey, q, latitude, longitude, expandedRadius);
          for (const place of results) {
            if (!seenIds.has(place.place_id)) {
              seenIds.add(place.place_id);
              allRawResults.push(place);
            }
          }
        }
      }

      // Events-specific: exclude outdoor fillers unless Free price
      let eventCandidates = allRawResults;
      if (!isFreePrice) {
        const OUTDOOR_EXCLUDE = new Set(["park", "campground", "natural_feature", "hiking_area"]);
        const OUTDOOR_KW = ["trail", "playground", "nature area", "scenic overlook", "outdoor recreation", "dog park", "skate park"];
        eventCandidates = allRawResults.filter(p => {
          const types: string[] = p.types || [];
          const nameLow = (p.name || "").toLowerCase();
          if (types.some(t => OUTDOOR_EXCLUDE.has(t))) return false;
          if (OUTDOOR_KW.some(kw => nameLow.includes(kw))) return false;
          return true;
        });
      }

      // Run through pipeline
      const validated = runFilterPipeline(
        eventCandidates.map(r => ({ ...r, types: r.types || [], name: r.name || "" })),
        "events",
        filterArr,
        6,
        3
      );

      const serviceKeyEv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const sbUrlEv = Deno.env.get("SUPABASE_URL")!;
      const spots = await Promise.all(
        validated.slice(0, 10).map((place, idx) =>
          googlePlaceToSpot(place, apiKey, idx, latitude, longitude, undefined, sbUrlEv, serviceKeyEv || undefined)
        )
      );

      return new Response(JSON.stringify({ spots, source: "google-events" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== STANDARD GOOGLE FALLBACK ==========
    const placeTypes = intentToPlaceTypes(intent);

    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    if (filterArr.includes("cheap")) { maxPrice = 1; }
    else if (filterArr.includes("mid")) { minPrice = 1; maxPrice = 3; }
    else if (filterArr.includes("treat")) { minPrice = 3; }

    const allRawResults: any[] = [];
    const seenPlaceIds = new Set<string>();
    const typesToQuery = placeTypes.slice(0, 3);

    // Fetch from multiple types, passing openNow
    for (const type of typesToQuery) {
      const results = await googleNearbySearch(apiKey, latitude, longitude, googleRadius, type, minPrice, maxPrice, openNow);
      for (const place of results) {
        if (!seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          allRawResults.push(place);
        }
      }
    }

    // Filter out permanently/temporarily closed businesses
    const openRawResults = allRawResults.filter((r: any) =>
      r.business_status !== 'CLOSED_TEMPORARILY' && r.business_status !== 'PERMANENTLY_CLOSED'
    );

    // If too few, widen radius
    if (openRawResults.length < 8 && !filterArr.includes("near-me")) {
      const widerRadius = Math.min(googleRadius * 2, 25000);
      for (const type of typesToQuery.slice(0, 2)) {
        const results = await googleNearbySearch(apiKey, latitude, longitude, widerRadius, type, minPrice, maxPrice, openNow);
        for (const place of results) {
          if (!seenPlaceIds.has(place.place_id)) {
            seenPlaceIds.add(place.place_id);
            if (place.business_status !== 'CLOSED_TEMPORARILY' && place.business_status !== 'PERMANENTLY_CLOSED') {
              openRawResults.push(place);
            }
          }
        }
      }
    }

    // Run through unified pipeline
    const validated = runFilterPipeline(
      openRawResults.map(r => ({ ...r, types: r.types || [], name: r.name || "" })),
      effectiveIntent,
      filterArr,
      8,
      2
    );

    const serviceKeyStd = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const sbUrlStd = Deno.env.get("SUPABASE_URL")!;
    const spots = await Promise.all(
      validated.slice(0, 10).map((place, idx) =>
        googlePlaceToSpot(place, apiKey, idx, latitude, longitude, undefined, sbUrlStd, serviceKeyStd || undefined)
      )
    );

    return new Response(JSON.stringify({ spots, source: "google" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("search-places error:", err);
    return new Response(JSON.stringify({ error: "Failed to search places" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
