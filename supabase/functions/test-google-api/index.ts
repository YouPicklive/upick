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

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "No API key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Test 1: Text Search
  const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent("Sub Rosa Bakery Richmond VA")}&key=${apiKey}`;
  const textRes = await fetch(textUrl);
  const textData = await textRes.json();

  // Test 2: Find Place
  const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent("Sub Rosa Bakery Richmond VA")}&inputtype=textquery&fields=place_id,photos,name&key=${apiKey}`;
  const findRes = await fetch(findUrl);
  const findData = await findRes.json();

  return new Response(JSON.stringify({
    text_search: { status: textData.status, error_message: textData.error_message, result_count: textData.results?.length || 0, first_result: textData.results?.[0] ? { name: textData.results[0].name, has_photos: !!(textData.results[0].photos), photo_count: textData.results[0].photos?.length || 0 } : null },
    find_place: { status: findData.status, error_message: findData.error_message, candidate_count: findData.candidates?.length || 0, first_candidate: findData.candidates?.[0] ? { name: findData.candidates[0].name, has_photos: !!(findData.candidates[0].photos), photo_count: findData.candidates[0].photos?.length || 0 } : null },
  }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
