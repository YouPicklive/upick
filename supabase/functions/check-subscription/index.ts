import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLUS_PRODUCT_ID = "prod_Tummobc6d7L8Qe";
const PLUS_PRICE_IDS = [
  "price_1SxAyfC3xPeU0PAgoYHXcyEX",
  "price_1SwxCjC3xPeU0PAg3QHE4iHg",
  "price_1Sx9jOC3xPeU0PAgVxH6M4PQ",
];

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Fetch current entitlements
    const { data: entitlements } = await supabaseAdmin
      .from("user_entitlements")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const isManuallyActivated = entitlements?.plus_active === true;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      if (!isManuallyActivated) {
        await supabaseAdmin.from("user_entitlements").update({
          plus_active: false,
          tier: "free",
          unlimited_spins: false,
          can_save_fortunes: false,
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id);
      }

      return new Response(JSON.stringify({
        subscribed: isManuallyActivated,
        subscription_end: null,
        tier: isManuallyActivated ? "plus" : (entitlements?.tier || "free"),
        unlimited_spins: isManuallyActivated ? true : (entitlements?.unlimited_spins || false),
        can_save_fortunes: isManuallyActivated ? true : (entitlements?.can_save_fortunes || false),
        spins_used_today: entitlements?.spins_used_today || 0,
        free_spin_limit_per_day: entitlements?.free_spin_limit_per_day || 1,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Ensure stripe_customers mapping
    await supabaseAdmin.from("stripe_customers").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
    }, { onConflict: "user_id" });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    let hasActivePlus = false;
    let subscriptionEnd: string | null = null;

    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const priceId = item.price.id;
        const productId = typeof item.price.product === "string"
          ? item.price.product
          : item.price.product.id;

        if (productId === PLUS_PRODUCT_ID || PLUS_PRICE_IDS.includes(priceId)) {
          hasActivePlus = true;
          subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
          break;
        }
      }
      if (hasActivePlus) break;
    }

    const finalPlusStatus = hasActivePlus || isManuallyActivated;

    if (hasActivePlus) {
      await supabaseAdmin.from("user_entitlements").upsert({
        user_id: user.id,
        plus_active: true,
        tier: "plus",
        unlimited_spins: true,
        can_save_fortunes: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } else if (!isManuallyActivated) {
      await supabaseAdmin.from("user_entitlements").update({
        plus_active: false,
        tier: "free",
        unlimited_spins: false,
        can_save_fortunes: false,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    }

    // Refetch entitlements after sync
    const { data: refreshed } = await supabaseAdmin
      .from("user_entitlements")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return new Response(JSON.stringify({
      subscribed: finalPlusStatus,
      subscription_end: subscriptionEnd,
      tier: refreshed?.tier || "free",
      unlimited_spins: refreshed?.unlimited_spins || false,
      can_save_fortunes: refreshed?.can_save_fortunes || false,
      spins_used_today: refreshed?.spins_used_today || 0,
      free_spin_limit_per_day: refreshed?.free_spin_limit_per_day || 1,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
