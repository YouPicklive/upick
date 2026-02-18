import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PlaceDetailsSchema = z.object({
  placeId: z.string().trim().min(1, "placeId required").max(300, "placeId too long").regex(/^[A-Za-z0-9_-]+$/, "Invalid placeId format"),
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
    const parsed = PlaceDetailsSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { placeId } = parsed.data;

    const params = new URLSearchParams({
      place_id: placeId,
      fields: "place_id,geometry,address_components,formatted_address,name",
      key: apiKey,
    });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );
    const data = await res.json();

    if (data.status !== "OK") {
      return new Response(
        JSON.stringify({ error: data.error_message || data.status }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = data.result;
    const components = result.address_components || [];

    const getComponent = (type: string) =>
      components.find((c: any) => c.types.includes(type));

    const locality = getComponent("locality");
    const adminArea = getComponent("administrative_area_level_1");
    const country = getComponent("country");

    const location = {
      placeId: result.place_id,
      city: locality?.long_name || result.name || "",
      stateRegion: adminArea?.long_name || "",
      stateRegionShort: adminArea?.short_name || "",
      country: country?.long_name || "",
      countryCode: country?.short_name || "",
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
      formattedAddress: result.formatted_address || "",
    };

    return new Response(JSON.stringify({ location }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("place-details error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});