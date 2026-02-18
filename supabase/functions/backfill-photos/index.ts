import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const BackfillSchema = z.object({
  business_ids: z.array(z.string().uuid()).max(100).optional(),
  limit: z.number().int().min(1).max(200).optional().default(50),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Fetches a Google Places photo URL for a business using Find Place + Place Details.
 * Returns the photo URL string or null.
 */
async function fetchPhotoForBusiness(
  name: string,
  lat: number | null,
  lng: number | null,
  city: string | null,
  apiKey: string
): Promise<string | null> {
  try {
    // Step 1: Find Place from Text
    const query = `${name} ${city || ""}`.trim();
    const locationBias = lat && lng ? `&locationbias=point:${lat},${lng}` : "";
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,photos${locationBias}&key=${apiKey}`;

    const findRes = await fetch(findUrl);
    const findData = await findRes.json();

    if (findData.candidates && findData.candidates.length > 0) {
      const candidate = findData.candidates[0];

      // If photos are returned directly from Find Place
      if (candidate.photos && candidate.photos.length > 0) {
        const photoRef = candidate.photos[0].photo_reference;
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;
      }

      // Step 2: Fall back to Place Details for photos
      if (candidate.place_id) {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${candidate.place_id}&fields=photos&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.result?.photos && detailsData.result.photos.length > 0) {
          const photoRef = detailsData.result.photos[0].photo_reference;
          return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;
        }
      }
    }

    return null;
  } catch (err) {
    console.error(`Photo fetch failed for "${name}":`, err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate caller is admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await authClient.auth.getClaims(token);
      const userId = claimsData?.claims?.sub as string | undefined;
      if (userId) {
        const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
        const { data: roleData } = await adminSupabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleData) {
          return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GOOGLE_PLACES_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Optional: pass specific business IDs, otherwise backfill all missing
    const rawBody = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const parsed = BackfillSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { business_ids, limit } = parsed.data;

    let query = supabase
      .from("businesses")
      .select("id, name, latitude, longitude, city, photo_url")
      .eq("active", true)
      .or("photo_url.is.null,photo_url.eq.")
      .limit(limit);

    if (business_ids && Array.isArray(business_ids) && business_ids.length > 0) {
      query = query.in("id", business_ids);
    }

    const { data: businesses, error: dbError } = await query;

    if (dbError) {
      console.error("DB query error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to query businesses" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!businesses || businesses.length === 0) {
      return new Response(JSON.stringify({ message: "No businesses need photo backfill", updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    const results: { id: string; name: string; photo_url: string | null; status: string }[] = [];

    for (const biz of businesses) {
      const photoUrl = await fetchPhotoForBusiness(
        biz.name,
        biz.latitude,
        biz.longitude,
        biz.city,
        apiKey
      );

      if (photoUrl) {
        const { error: updateError } = await supabase
          .from("businesses")
          .update({ photo_url: photoUrl })
          .eq("id", biz.id);

        if (!updateError) {
          updated++;
          results.push({ id: biz.id, name: biz.name, photo_url: photoUrl, status: "updated" });
        } else {
          results.push({ id: biz.id, name: biz.name, photo_url: null, status: "update_failed" });
        }
      } else {
        results.push({ id: biz.id, name: biz.name, photo_url: null, status: "no_photo_found" });
      }
    }

    return new Response(JSON.stringify({ updated, total: businesses.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("backfill-photos error:", err);
    return new Response(JSON.stringify({ error: "Failed to backfill photos" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
