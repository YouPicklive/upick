import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AutocompleteSchema = z.object({
  query: z.string().trim().min(2, "Query too short").max(200, "Query too long"),
  types: z.string().max(100).regex(/^[a-z_()]+$/, "Invalid types format").optional(),
  componentRestrictions: z.object({
    country: z.string().length(2).regex(/^[a-zA-Z]{2}$/, "Invalid country code").optional(),
  }).optional(),
});

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

    const rawBody = await req.json();
    const parsed = AutocompleteSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(JSON.stringify({ predictions: [], error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, types, componentRestrictions } = parsed.data;

    // Build Google Places Autocomplete URL
    const params = new URLSearchParams({
      input: query,
      key: apiKey,
    });

    if (types) {
      params.set("types", types);
    }

    if (componentRestrictions?.country) {
      params.set("components", `country:${componentRestrictions.country}`);
    }

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Autocomplete API error:", data.status, data.error_message);
      return new Response(
        JSON.stringify({ predictions: [], error: data.error_message }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const predictions = (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || "",
      types: p.types || [],
    }));

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("places-autocomplete error:", err);
    return new Response(JSON.stringify({ error: "Internal error", predictions: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});