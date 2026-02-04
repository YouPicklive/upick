import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// YouPick Plus subscription product ID and price IDs
const PLUS_PRODUCT_ID = "prod_Tummobc6d7L8Qe";
const PLUS_PRICE_IDS = [
  "price_1SxAyfC3xPeU0PAgoYHXcyEX", // $5.99/month (current)
  "price_1SwxCjC3xPeU0PAg3QHE4iHg", // $4.99/month (legacy)
  "price_1Sx9jOC3xPeU0PAgVxH6M4PQ", // legacy price
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
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer in Stripe by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found - user has no subscriptions");
      
      // Update database to reflect no active subscription
      await supabaseAdmin
        .from("user_entitlements")
        .update({ plus_active: false, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    logStep("Subscriptions found", { count: subscriptions.data.length });

    // Find a subscription for YouPick Plus product or price
    let hasActivePlus = false;
    let subscriptionEnd: string | null = null;

    for (const subscription of subscriptions.data) {
      logStep("Checking subscription", { subscriptionId: subscription.id });
      
      for (const item of subscription.items.data) {
        const priceId = item.price.id;
        const productId = typeof item.price.product === 'string' 
          ? item.price.product 
          : item.price.product.id;
        
        logStep("Subscription item", { priceId, productId });
        
        // Check if this is a Plus subscription by product ID or price ID
        if (productId === PLUS_PRODUCT_ID || PLUS_PRICE_IDS.includes(priceId)) {
          hasActivePlus = true;
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
          logStep("Active Plus subscription found", { 
            subscriptionId: subscription.id, 
            priceId,
            productId,
            endDate: subscriptionEnd 
          });
          break;
        }
      }
      if (hasActivePlus) break;
    }

    // Update database with subscription status
    const { error: updateError } = await supabaseAdmin
      .from("user_entitlements")
      .upsert({
        user_id: user.id,
        plus_active: hasActivePlus,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: "user_id",
        ignoreDuplicates: false 
      });

    if (updateError) {
      logStep("ERROR: Failed to update entitlements", { error: updateError.message });
    } else {
      logStep("Entitlements synced with Stripe", { plusActive: hasActivePlus });
    }

    return new Response(JSON.stringify({
      subscribed: hasActivePlus,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
