import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory cache (edge function instance level)
const cache = new Map<string, { cities: any[]; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { stateRegionName, countryName, countryCode } = await req.json();

    if (!stateRegionName) {
      return new Response(JSON.stringify({ error: "stateRegionName required", cities: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = `${stateRegionName}_${countryCode || countryName || ""}`.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ cities: cached.cities }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const countryLabel = countryName || countryCode || "";
    const query = `cities in ${stateRegionName}${countryLabel ? `, ${countryLabel}` : ""}`;

    const seenNames = new Set<string>();
    const cities: any[] = [];
    let nextPageToken: string | null = null;
    let pageCount = 0;
    const MAX_PAGES = 3; // Google allows up to 3 pages (60 results)

    // Paginate through Google Text Search results
    do {
      const params = new URLSearchParams({
        query,
        type: "locality",
        key: apiKey,
      });
      if (nextPageToken) {
        params.set("pagetoken", nextPageToken);
      }

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
      );
      const data = await res.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Text search error:", data.status, data.error_message);
        break;
      }

      for (const place of data.results || []) {
        const name = place.name;
        const nameKey = name.toLowerCase().trim();
        if (seenNames.has(nameKey)) continue;
        seenNames.add(nameKey);

        cities.push({
          placeId: place.place_id,
          name: place.name,
          formattedAddress: place.formatted_address || "",
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
        });
      }

      nextPageToken = data.next_page_token || null;
      pageCount++;

      // Google requires a short delay before using next_page_token
      if (nextPageToken && pageCount < MAX_PAGES) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } while (nextPageToken && pageCount < MAX_PAGES);

    // Sort alphabetically
    cities.sort((a, b) => a.name.localeCompare(b.name));

    // Cache the result
    cache.set(cacheKey, { cities, ts: Date.now() });

    return new Response(JSON.stringify({ cities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-cities-in-region error:", err);
    return new Response(JSON.stringify({ error: "Internal error", cities: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
