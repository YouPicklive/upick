import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const SearchPlacesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  intent: z.enum(["food", "drinks", "activity", "shopping", "events", "services", "surprise"]).nullable().optional(),
  energy: z.string().max(50).nullable().optional(),
  filters: z.array(z.string().max(50)).max(20).nullable().optional(),
  shoppingSubcategory: z.enum(["random", "decor", "clothes", "games", "books", "gifts", "vintage", "artisan"]).nullable().optional(),
  selectedVibe: z.string().max(50).nullable().optional(),
});

// AV/equipment company exclusion for Activities
const AV_EXCLUDE_TYPES = new Set([
  "electronics_store", "home_goods_store", "general_contractor",
  "storage", "moving_company", "car_rental",
]);
const AV_EXCLUDE_TERMS = [
  "audio visual", "audiovisual", "av ", "event production",
  "event services", "lighting rental", "staging", "party rental",
  "equipment rental", "production company", "speaker rental",
  "projector", "truss",
];

function isAVCompany(place: any): boolean {
  const types = place.types || [];
  if (types.some((t: string) => AV_EXCLUDE_TYPES.has(t))) return true;
  const text = `${place.name || ""} ${place.vicinity || ""} ${place.formatted_address || ""}`.toLowerCase();
  return AV_EXCLUDE_TERMS.some(term => text.includes(term));
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map vibe intents to business categories stored in DB
function intentToDBCategories(intent: string | null): string[] {
  switch (intent) {
    case "food":
      return ["restaurant", "cafe", "bakery", "food-truck", "brunch", "lunch", "dinner", "desserts"];
    case "drinks":
      return ["bar", "nightlife", "cocktail-lounge", "wine-bar", "dive-bar", "rooftop-bar"];
    case "activity":
      return ["activity", "park", "museum", "bowling", "arcade", "escape-room", "golf", "mini-golf", "hiking", "workshop"];
    case "shopping":
      return ["shopping", "retail", "boutique", "thrift", "market", "vintage", "mall"];
    case "events":
      return ["event", "concert", "festival", "live-music", "art-show", "pop-up", "nightlife"];
    case "services":
      return ["wellness", "spa", "yoga", "fitness", "gym", "meditation", "massage"];
    case "surprise":
    default:
      return [];
  }
}

// Map vibe intents to Google Places types (non-shopping)
function intentToPlaceTypes(intent: string | null): string[] {
  switch (intent) {
    case "food":
      return ["restaurant", "bakery", "cafe", "meal_takeaway"];
    case "drinks":
      return ["bar", "night_club"];
    case "activity":
      return ["amusement_park", "bowling_alley", "museum", "park", "tourist_attraction"];
    case "shopping":
      return ["shopping_mall", "store", "clothing_store"];
    case "events":
      return ["stadium", "movie_theater", "night_club"];
    case "services":
      return ["spa", "gym", "physiotherapist"];
    case "surprise":
    default:
      return ["restaurant", "bar", "cafe", "tourist_attraction"];
  }
}

// Shopping subcategory → Google Places type search config
interface ShoppingSearchConfig {
  types: string[];
  textQueries: string[];
}

function shoppingSubcategoryConfig(sub: string | null | undefined): ShoppingSearchConfig {
  switch (sub) {
    case "decor":
      return { types: ["home_goods_store", "furniture_store"], textQueries: ["home decor store", "interior design store", "lighting store"] };
    case "clothes":
      return { types: ["clothing_store", "shoe_store"], textQueries: ["boutique clothing", "fashion store"] };
    case "games":
      return { types: [], textQueries: ["board game store", "game store", "comic shop", "hobby shop"] };
    case "books":
      return { types: ["book_store"], textQueries: ["bookstore", "used books"] };
    case "gifts":
      return { types: [], textQueries: ["gift shop", "novelty shop", "souvenir shop"] };
    case "vintage":
      return { types: [], textQueries: ["vintage store", "thrift store", "consignment shop", "antique store"] };
    case "artisan":
      return { types: [], textQueries: ["local artisan shop", "gallery shop", "makers market", "craft store"] };
    case "random":
    default:
      return { types: ["shopping_mall", "department_store", "clothing_store"], textQueries: ["boutique", "shop"] };
  }
}

// Subcategory-specific ALLOWED Google Place types — results must match at least one
const SHOPPING_ALLOWED_TYPES: Record<string, Set<string>> = {
  decor: new Set(["home_goods_store", "furniture_store", "home_improvement_store", "art_gallery", "lighting_store", "store"]),
  clothes: new Set(["clothing_store", "shoe_store", "jewelry_store", "store"]),
  games: new Set(["store", "book_store"]),
  books: new Set(["book_store", "library", "store"]),
  gifts: new Set(["store", "jewelry_store"]),
  vintage: new Set(["store", "clothing_store", "furniture_store", "home_goods_store"]),
  artisan: new Set(["store", "art_gallery", "jewelry_store"]),
};

// Universal exclusion types for ALL shopping subcategories
const SHOPPING_EXCLUDE_TYPES = new Set([
  "pharmacy", "drugstore", "health", "hospital", "doctor", "dentist",
  "veterinary_care", "insurance_agency", "lawyer", "accounting",
  "plumber", "electrician", "roofing_contractor", "general_contractor",
  "locksmith", "moving_company", "storage", "car_repair", "car_wash",
  "gas_station", "convenience_store", "atm", "bank", "post_office",
  "local_government_office", "courthouse", "fire_station", "police",
  "funeral_home", "laundry", "dry_cleaning", "car_dealer", "car_rental",
  "real_estate_agency", "travel_agency", "lodging",
]);

// Universal exclusion keywords for shopping results
const SHOPPING_EXCLUDE_KEYWORDS = [
  "pharmacy", "cvs", "walgreens", "rite aid", "plumbing", "hvac",
  "contractor", "roofing", "electric", "landscaping", "pest control",
  "auto repair", "car wash", "insurance", "attorney", "dental",
  "medical", "clinic", "urgent care", "chiropractic", "storage unit",
  "dry cleaner", "laundromat", "tax service", "notary",
];

function isValidShoppingResult(place: any, subcategory: string): boolean {
  const types: string[] = place.types || [];
  // Reject if any excluded type matches
  if (types.some((t: string) => SHOPPING_EXCLUDE_TYPES.has(t))) return false;
  // Reject by keyword
  const text = `${place.name || ""}`.toLowerCase();
  if (SHOPPING_EXCLUDE_KEYWORDS.some(kw => text.includes(kw))) return false;
  // For specific subcategories (not random), require at least one allowed type
  const allowed = SHOPPING_ALLOWED_TYPES[subcategory];
  if (allowed && !types.some((t: string) => allowed.has(t))) return false;
  return true;
}

function mapPriceLevel(priceLevel?: number): 1 | 2 | 3 | 4 {
  if (priceLevel === undefined || priceLevel === null) return 2;
  if (priceLevel <= 1) return 1;
  if (priceLevel === 2) return 2;
  if (priceLevel === 3) return 3;
  return 4;
}

function mapPriceLevelFromString(pl?: string): 1 | 2 | 3 | 4 {
  switch (pl) {
    case "$": return 1;
    case "$$": return 2;
    case "$$$": return 3;
    case "$$$$": return 4;
    default: return 2;
  }
}

// Map Google price_level (0-4) to app price display string
function googlePriceToAppLabel(priceLevel?: number): string {
  if (priceLevel === undefined || priceLevel === null) return "Price unknown";
  if (priceLevel <= 1) return "$";
  if (priceLevel === 2) return "$$";
  if (priceLevel === 3) return "$$$";
  return "$$$$";
}

// Check if Google price_level matches user filter
function matchesPriceFilter(priceLevel: number | undefined | null, filters?: string[]): boolean {
  if (!filters) return true;
  const hasCheap = filters.includes("cheap");
  const hasMid = filters.includes("mid");
  const hasTreat = filters.includes("treat");
  if (!hasCheap && !hasMid && !hasTreat) return true;
  // When "cheap" (Free) is selected, EXCLUDE unknown prices — free must mean free
  if (priceLevel === undefined || priceLevel === null) {
    return hasCheap ? false : true;
  }
  if (hasCheap && priceLevel <= 1) return true;
  if (hasMid && priceLevel >= 1 && priceLevel <= 3) return true;
  if (hasTreat && priceLevel >= 3) return true;
  return false;
}

function mapCategory(types: string[]): string {
  if (types.some((t) => ["bar", "night_club"].includes(t))) return "bar";
  if (types.some((t) => ["shopping_mall", "store", "clothing_store", "shoe_store", "jewelry_store", "book_store", "home_goods_store", "furniture_store", "electronics_store", "department_store"].includes(t))) return "shopping";
  if (types.some((t) => ["spa", "physiotherapist", "gym"].includes(t))) return "wellness";
  if (types.some((t) => ["cafe", "bakery"].includes(t))) return "cafe";
  if (types.some((t) => ["amusement_park", "bowling_alley", "movie_theater", "museum", "park", "tourist_attraction", "stadium", "zoo", "aquarium", "campground"].includes(t)))
    return "activity";
  return "restaurant";
}

function inferVibeLevel(types: string[], _rating?: number): string {
  if (types.some((t) => ["night_club"].includes(t))) return "dancing";
  if (types.some((t) => ["bar", "bowling_alley", "amusement_park", "gym", "stadium"].includes(t))) return "active";
  if (types.some((t) => ["spa", "park", "museum", "cafe", "bakery"].includes(t))) return "chill";
  return "moderate";
}

function extractNeighborhood(formattedAddress?: string): string {
  if (!formattedAddress) return "Nearby";
  const parts = formattedAddress.split(",").map((p) => p.trim());
  return parts[1] || parts[0] || "Nearby";
}

function mapEnergyToVibeLevel(energy?: string): string {
  switch (energy) {
    case "chill": return "chill";
    case "moderate": return "moderate";
    case "hype": return "active";
    default: return "moderate";
  }
}

// Haversine distance in miles
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMaxRadiusMiles(filters?: string[]): number {
  if (!filters) return 15;
  if (filters.includes("near-me")) return 1;
  if (filters.includes("short-drive")) return 5;
  if (filters.includes("any-distance")) return 45;
  return 15;
}

// Richmond, VA fallback coordinates
const RICHMOND_FALLBACK = { lat: 37.5407, lng: -77.4360 };

// Google Nearby Search by type
async function googleNearbySearch(
  apiKey: string,
  lat: number,
  lng: number,
  radius: number,
  type: string,
  minPrice?: number,
  maxPrice?: number
): Promise<any[]> {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radius),
    type,
    key: apiKey,
  });
  if (minPrice !== undefined) params.set("minprice", String(minPrice));
  if (maxPrice !== undefined) params.set("maxprice", String(maxPrice));
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

// Google Text Search
async function googleTextSearch(
  apiKey: string,
  query: string,
  lat: number,
  lng: number,
  radius: number
): Promise<any[]> {
  const params = new URLSearchParams({
    query,
    location: `${lat},${lng}`,
    radius: String(radius),
    key: apiKey,
  });
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

// Convert a Google Places result to our Spot format
function googlePlaceToSpot(place: any, apiKey: string, idx: number, userLat: number, userLng: number): any {
  let image = "";
  if (place.photos && place.photos.length > 0) {
    const photoRef = place.photos[0].photo_reference;
    image = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`;
  }

  const lat = place.geometry?.location?.lat;
  const lng = place.geometry?.location?.lng;
  const distance = (lat && lng) ? Math.round(haversineDistance(userLat, userLng, lat, lng) * 10) / 10 : undefined;

  // Build short description from types
  const typeLabels = (place.types || [])
    .filter((t: string) => !["point_of_interest", "establishment"].includes(t))
    .slice(0, 2)
    .map((t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()));
  const description = place.formatted_address || typeLabels.join(", ") || "Local shop";

  return {
    id: place.place_id || `place-${idx}`,
    name: place.name,
    category: "shopping",
    description,
    priceLevel: mapPriceLevel(place.price_level),
    priceLabelOverride: googlePriceToAppLabel(place.price_level),
    rating: place.rating || 4.0,
    image,
    tags: (place.types || [])
      .filter((t: string) => !["point_of_interest", "establishment"].includes(t))
      .slice(0, 3)
      .map((t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())),
    neighborhood: extractNeighborhood(place.vicinity || place.formatted_address),
    isOutdoor: false,
    smokingFriendly: false,
    vibeLevel: "moderate",
    plusOnly: false,
    latitude: lat,
    longitude: lng,
    distance,
    placeId: place.place_id, // for Google Maps link
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const parsed = SearchPlacesSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { latitude, longitude, intent, energy, filters, shoppingSubcategory } = parsed.data;
    const isShopping = intent === "shopping" && shoppingSubcategory;

    const maxMiles = getMaxRadiusMiles(filters);

    // ========== SHOPPING SUBCATEGORY PATH ==========
    if (isShopping) {
      const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Google Places API key not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const config = shoppingSubcategoryConfig(shoppingSubcategory);
      const radiusSteps = [3000, 8000, 15000]; // meters
      const seenPlaceIds = new Set<string>();
      let allResults: any[] = [];

      const subKey = shoppingSubcategory || "random";

      for (const radiusM of radiusSteps) {
        // Try type-based search first
        for (const type of config.types) {
          if (allResults.length >= 10) break;
          const results = await googleNearbySearch(apiKey, latitude, longitude, radiusM, type);
          for (const r of results) {
            if (!seenPlaceIds.has(r.place_id) && isValidShoppingResult(r, subKey) && matchesPriceFilter(r.price_level, filters)) {
              seenPlaceIds.add(r.place_id);
              allResults.push(r);
            }
          }
        }

        // Then try text-based search
        if (allResults.length < 10) {
          for (const query of config.textQueries) {
            if (allResults.length >= 10) break;
            const results = await googleTextSearch(apiKey, query, latitude, longitude, radiusM);
            for (const r of results) {
              if (!seenPlaceIds.has(r.place_id) && isValidShoppingResult(r, subKey) && matchesPriceFilter(r.price_level, filters)) {
                seenPlaceIds.add(r.place_id);
                allResults.push(r);
              }
            }
          }
        }

        if (allResults.length >= 4) break;
      }

      // Fallback: if still 0, try broad text query with subcategory name
      if (allResults.length === 0) {
        const fallbackQuery = subKey === "random" ? "shop" : `${subKey} store`;
        const broadResults = await googleTextSearch(apiKey, fallbackQuery, latitude, longitude, 15000);
        for (const r of broadResults) {
          if (!seenPlaceIds.has(r.place_id) && isValidShoppingResult(r, subKey)) {
            seenPlaceIds.add(r.place_id);
            allResults.push(r);
          }
        }
      }

      // Cap at 10 and convert
      const spots = allResults
        .slice(0, 10)
        .map((place, idx) => googlePlaceToSpot(place, apiKey, idx, latitude, longitude));

      return new Response(JSON.stringify({ spots, source: "google-shopping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== STANDARD PATH (non-shopping or shopping without subcategory) ==========

    // --- Step 1: Try curated businesses table first ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const dbCategories = intentToDBCategories(intent);
    let query = supabase.from("businesses").select("*").eq("active", true);

    if (dbCategories.length > 0) {
      query = query.in("category", dbCategories);
    }

    // Price filters
    if (filters?.includes("cheap")) {
      query = query.in("price_level", ["$"]);
    } else if (filters?.includes("mid")) {
      query = query.in("price_level", ["$$"]);
    } else if (filters?.includes("treat")) {
      query = query.in("price_level", ["$$$", "$$$$"]);
    }

    // Energy filter
    if (energy) {
      const energyMap: Record<string, string[]> = {
        chill: ["chill"],
        social: ["moderate", "hype"],
        romantic: ["chill", "moderate"],
        adventure: ["hype"],
        productive: ["chill"],
        "self-care": ["chill"],
        weird: ["hype", "moderate"],
      };
      const energyValues = energyMap[energy];
      if (energyValues) {
        query = query.in("energy", energyValues);
      }
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
        const hasPriceFilter = filters?.includes("cheap") || filters?.includes("mid") || filters?.includes("treat");
        const priceFiltered = hasPriceFilter
          ? withDistance.filter((b: any) => b.price_level !== null)
          : withDistance;
        if (priceFiltered.length === 0) {
          return new Response(JSON.stringify({
            spots: [],
            source: "curated",
            message: "Nothing aligned here yet — try expanding your radius or adjusting price."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
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
                    image = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${apiKey}`;

                    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
                    if (serviceKey) {
                      const adminClient = createClient(supabaseUrl, serviceKey);
                      adminClient.from("businesses").update({ photo_url: image }).eq("id", b.id).then(() => {});
                    }
                  }

                  if (!description && candidate.formatted_address) {
                    description = candidate.formatted_address;
                  }
                }
              } catch (e) {
                console.error(`Google enrichment failed for ${b.name}:`, e);
              }
            }

            return {
              id: b.id,
              name: b.name,
              category: b.category,
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
              latitude: b.latitude,
              longitude: b.longitude,
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
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const placeTypes = intentToPlaceTypes(intent);
    let radius = 5000;
    if (filters?.includes("near-me")) radius = 1500;
    if (filters?.includes("any-distance")) radius = 15000;

    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    if (filters?.includes("cheap")) {
      maxPrice = 1;
    } else if (filters?.includes("mid")) {
      minPrice = 1;
      maxPrice = 3;
    } else if (filters?.includes("treat")) {
      minPrice = 3;
    }

    const allResults: any[] = [];
    const seenPlaceIds = new Set<string>();
    const typesToQuery = placeTypes.slice(0, 2);

    for (const type of typesToQuery) {
      const results = await googleNearbySearch(apiKey, latitude, longitude, radius, type, minPrice, maxPrice);
      for (const place of results) {
        if (!seenPlaceIds.has(place.place_id)) {
          // Filter out AV companies for Activities
          if (intent === "activity" && isAVCompany(place)) continue;
          seenPlaceIds.add(place.place_id);
          allResults.push(place);
        }
      }
    }

    const spots = allResults.slice(0, 10).map((place, idx) => {
      let image = "";
      if (place.photos && place.photos.length > 0) {
        const photoRef = place.photos[0].photo_reference;
        image = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`;
      }

      const category = mapCategory(place.types || []);
      const vibeLevel = inferVibeLevel(place.types || [], place.rating);

      return {
        id: place.place_id || `place-${idx}`,
        name: place.name,
        category,
        description: place.vicinity || place.formatted_address || "A great spot nearby",
        priceLevel: mapPriceLevel(place.price_level),
        rating: place.rating || 4.0,
        image,
        tags: (place.types || [])
          .filter((t: string) => !["point_of_interest", "establishment"].includes(t))
          .slice(0, 3)
          .map((t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())),
        neighborhood: extractNeighborhood(place.vicinity),
        isOutdoor: (place.types || []).some((t: string) => ["park", "campground", "stadium"].includes(t)),
        smokingFriendly: false,
        vibeLevel,
        plusOnly: false,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
      };
    });

    return new Response(JSON.stringify({ spots, source: "google" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("search-places error:", err);
    return new Response(JSON.stringify({ error: "Failed to search places" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
