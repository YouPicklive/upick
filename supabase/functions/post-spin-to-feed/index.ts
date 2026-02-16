import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spin_event_id } = await req.json();
    if (!spin_event_id) {
      return new Response(JSON.stringify({ error: "spin_event_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch spin event
    const { data: spinEvent, error: seErr } = await supabase
      .from("spin_events")
      .select("*")
      .eq("id", spin_event_id)
      .single();

    if (seErr || !spinEvent) {
      return new Response(JSON.stringify({ error: "Spin event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user opted out of posting this spin
    if (!spinEvent.should_post_to_feed) {
      return new Response(JSON.stringify({ ok: true, skipped: "user_opted_out" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile for privacy and display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username, default_post_privacy")
      .eq("id", spinEvent.user_id)
      .single();

    const privacy = profile?.default_post_privacy || "public";

    // If private, skip
    if (privacy === "private") {
      return new Response(JSON.stringify({ ok: true, skipped: "private_profile" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAnon = privacy === "anonymous";
    const displayName = profile?.display_name || profile?.username || "Someone";
    const title = isAnon
      ? `Someone just landed on ${spinEvent.place_name} 🎯`
      : `${displayName} landed on ${spinEvent.place_name} 🎯`;

    const { error: insertErr } = await supabase.from("feed_posts").insert({
      user_id: isAnon ? null : spinEvent.user_id,
      post_type: "spin_result",
      title,
      body: spinEvent.caption || null,
      result_place_id: spinEvent.place_id,
      result_name: spinEvent.place_name,
      result_category: spinEvent.category,
      lat: spinEvent.lat,
      lng: spinEvent.lng,
      city: spinEvent.city,
      region: spinEvent.region,
      is_anonymous: isAnon,
      is_bot: false,
      visibility: "public",
    });

    if (insertErr) {
      console.error("Feed post insert error:", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark spin event as posted
    await supabase
      .from("spin_events")
      .update({ posted_to_feed_at: new Date().toISOString() })
      .eq("id", spin_event_id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
