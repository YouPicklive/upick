import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map vibe intents to Google Places types
function intentToPlaceTypes(intent: string | null): string[] {
  switch (intent) {
    case "food":
      return ["restaurant", "meal_delivery", "meal_takeaway"];
    case "drinks":
      return ["bar", "night_club", "cafe"];
    case "activity":
      return ["amusement_park", "bowling_alley", "gym", "movie_theater", "museum", "park", "tourist_attraction"];
    case "shopping":
      return ["shopping_mall", "store", "clothing_store"];
    case "events":
      return ["night_club", "stadium", "movie_theater"];
    case "services":
      return ["spa", "beauty_salon", "hair_care"];
    case "event-planning":
      return ["event_venue", "restaurant", "banquet_hall"];
    case "corporate":
      return ["restaurant", "conference_center"];
    case "surprise":
    default:
      return ["restaurant", "bar", "cafe", "tourist_attraction"];
  }
}

// Map Google price_level to our 1-4 scale
function mapPriceLevel(priceLevel?: number): 1 | 2 | 3 | 4 {
  if (priceLevel === undefined || priceLevel === null) return 2;
  if (priceLevel <= 1) return 1;
  if (priceLevel === 2) return 2;
  if (priceLevel === 3) return 3;
  return 4;
}

// Map Google types to our category
function mapCategory(types: string[]): string {
  if (types.some((t) => ["bar", "night_club"].includes(t))) return "bar";
  if (types.some((t) => ["cafe", "bakery"].includes(t))) return "cafe";
  if (types.some((t) => ["spa", "beauty_salon", "hair_care"].includes(t))) return "wellness";
  if (
    types.some((t) =>
      ["amusement_park", "bowling_alley", "gym", "movie_theater", "museum", "park", "tourist_attraction", "stadium", "shopping_mall", "store"].includes(t)
    )
  )
    return "activity";
  return "restaurant";
}

// Infer vibe level from rating + types
function inferVibeLevel(types: string[], _rating?: number): string {
  if (types.some((t) => ["night_club"].includes(t))) return "dancing";
  if (types.some((t) => ["bar", "bowling_alley", "amusement_park", "gym", "stadium"].includes(t))) return "active";
  if (types.some((t) => ["spa", "park", "museum", "cafe", "bakery"].includes(t))) return "chill";
  return "moderate";
}

// Extract neighborhood from address components or formatted address
function extractNeighborhood(formattedAddress?: string): string {
  if (!formattedAddress) return "Nearby";
  // Take the second part of the comma-separated address (usually city/neighborhood)
  const parts = formattedAddress.split(",").map((p) => p.trim());
  return parts[1] || parts[0] || "Nearby";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, intent, energy, filters } = await req.json();

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: "Coordinates required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Google Places API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const placeTypes = intentToPlaceTypes(intent);
    // Determine radius based on filters
    let radius = 5000; // default 5km
    if (filters?.includes("near-me")) radius = 1500;
    if (filters?.includes("any-distance")) radius = 15000;

    // Determine min/max price from filters
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

    // Use the first type for the primary search, then deduplicate
    const allResults: any[] = [];
    const seenPlaceIds = new Set<string>();

    // Query up to 2 types to get variety without excessive API calls
    const typesToQuery = placeTypes.slice(0, 2);

    for (const type of typesToQuery) {
      const params = new URLSearchParams({
        location: `${latitude},${longitude}`,
        radius: String(radius),
        type,
        key: apiKey,
      });
      if (minPrice !== undefined) params.set("minprice", String(minPrice));
      if (maxPrice !== undefined) params.set("maxprice", String(maxPrice));

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.results) {
        for (const place of data.results) {
          if (!seenPlaceIds.has(place.place_id)) {
            seenPlaceIds.add(place.place_id);
            allResults.push(place);
          }
        }
      }
    }

    // Map to our Spot format
    const spots = allResults.slice(0, 10).map((place, idx) => {
      // Build photo URL if available
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

    return new Response(JSON.stringify({ spots }), {
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
