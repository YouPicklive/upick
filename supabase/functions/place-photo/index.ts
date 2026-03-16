import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ref = url.searchParams.get("ref");
    const maxwidth = url.searchParams.get("maxwidth") || "1200";

    if (!ref) {
      return new Response("Missing photo reference", { status: 400, headers: corsHeaders });
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response("API key not configured", { status: 500, headers: corsHeaders });
    }

    const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${ref}&key=${apiKey}`;
    const photoRes = await fetch(googleUrl, { redirect: "follow" });

    if (!photoRes.ok) {
      return new Response("Photo not found", { status: 404, headers: corsHeaders });
    }

    const contentType = photoRes.headers.get("content-type") || "image/jpeg";
    const body = await photoRes.arrayBuffer();

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable", // 7 day cache
      },
    });
  } catch (error) {
    console.error("Photo proxy error:", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
