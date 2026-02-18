import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Map Stripe price IDs to pack keys
const PRICE_TO_PACK_MAP: Record<string, string> = {
  "price_1Sx9o1C3xPeU0PAg4tyGgK7n": "career",
  "price_1Sx9qmC3xPeU0PAg3TQs8EDG": "unhinged",
  "price_1Sx9qmC3xPeU0PAgKdTJQ6PR": "main_character",
};

const PLUS_PRICE_IDS = [
  "price_1SxAyfC3xPeU0PAgoYHXcyEX",
  "price_1SwxCjC3xPeU0PAg3QHE4iHg",
  "price_1Sx9jOC3xPeU0PAgVxH6M4PQ",
];

const PREMIUM_PRODUCT_ID = "prod_TzycjdZA50XUgg";
const PREMIUM_PRICE_IDS = [
  "price_1T1yfgC3xPeU0PAgY8vDXKTo",
];

/**
 * Resolve user_id from Stripe event metadata or stripe_customers table.
 */
async function resolveUserId(
  supabaseAdmin: any,
  stripe: Stripe,
  metadata: Record<string, string> | null,
  customerId: string | null
): Promise<string | null> {
  if (metadata?.user_id) {
    logStep("Resolved user_id from metadata", { user_id: metadata.user_id });
    return metadata.user_id;
  }

  if (customerId) {
    const { data } = await supabaseAdmin
      .from("stripe_customers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.user_id) {
      logStep("Resolved user_id from stripe_customers", { user_id: data.user_id });
      return data.user_id;
    }
  }

  if (customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.email) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users?.find((u: any) => u.email === customer.email);
        if (user) {
          logStep("Resolved user_id from email lookup", { user_id: user.id, email: customer.email });
          await supabaseAdmin.from("stripe_customers").upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
          }, { onConflict: "user_id" });
          return user.id;
        }
      }
    } catch (e) {
      logStep("Email lookup failed", { error: String(e) });
    }
  }

  return null;
}

/**
 * Determine tier from subscription items
 */
function determineTier(sub: Stripe.Subscription): "premium" | "plus" {
  for (const item of sub.items.data) {
    const priceId = item.price.id;
    const productId = typeof item.price.product === "string"
      ? item.price.product
      : item.price.product.id;
    if (productId === PREMIUM_PRODUCT_ID || PREMIUM_PRICE_IDS.includes(priceId)) {
      return "premium";
    }
  }
  return "plus";
}

/**
 * Set entitlements to given tier
 */
async function activateTier(supabaseAdmin: any, userId: string, tier: "plus" | "premium") {
  await supabaseAdmin.from("user_entitlements").upsert({
    user_id: userId,
    plus_active: true,
    tier,
    unlimited_spins: true,
    can_save_fortunes: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  logStep(`${tier} activated`, { userId });
}

/**
 * Downgrade entitlements to Free tier
 */
async function deactivatePlus(supabaseAdmin: any, userId: string) {
  await supabaseAdmin.from("user_entitlements").update({
    plus_active: false,
    tier: "free",
    unlimited_spins: false,
    can_save_fortunes: false,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
  logStep("Deactivated to free", { userId });
}

/**
 * Upsert stripe_subscriptions row
 */
async function upsertSubscription(supabaseAdmin: any, userId: string, sub: Stripe.Subscription) {
  const priceId = sub.items?.data?.[0]?.price?.id || null;
  await supabaseAdmin.from("stripe_subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: priceId,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });
  logStep("Subscription upserted", { subId: sub.id, status: sub.status });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const signature = req.headers.get("stripe-signature");
    if (!signature) return new Response("No signature", { status: 400, headers: corsHeaders });

    const body = await req.text();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Signature verified", { type: event.type });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logStep("Signature verification failed", { error: msg });
      return new Response(`Verification failed: ${msg}`, { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, mode: session.mode });

        const userId = await resolveUserId(
          supabaseAdmin, stripe,
          session.metadata as Record<string, string>,
          session.customer as string
        );
        if (!userId) {
          logStep("ERROR: Could not resolve user_id");
          return new Response("User not found", { status: 404, headers: corsHeaders });
        }

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        let isSubscription = session.mode === "subscription";
        let isPremium = false;
        const packKeys: string[] = [];

        for (const item of lineItems.data) {
          const priceId = item.price?.id;
          if (priceId && PREMIUM_PRICE_IDS.includes(priceId)) {
            isSubscription = true;
            isPremium = true;
          } else if (priceId && PLUS_PRICE_IDS.includes(priceId)) {
            isSubscription = true;
          } else if (priceId && PRICE_TO_PACK_MAP[priceId]) {
            packKeys.push(PRICE_TO_PACK_MAP[priceId]);
          }
        }

        if (packKeys.length > 0) {
          const { data: current } = await supabaseAdmin
            .from("user_entitlements")
            .select("owned_packs")
            .eq("user_id", userId)
            .maybeSingle();
          const merged = [...new Set([...(current?.owned_packs || []), ...packKeys])];
          await supabaseAdmin.from("user_entitlements")
            .update({ owned_packs: merged, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
          logStep("Packs updated", { packKeys, merged });
        }

        if (isSubscription) {
          await activateTier(supabaseAdmin, userId, isPremium ? "premium" : "plus");
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        logStep(`Subscription ${event.type}`, { subId: sub.id, status: sub.status });

        const userId = await resolveUserId(
          supabaseAdmin, stripe,
          sub.metadata as Record<string, string>,
          sub.customer as string
        );
        if (!userId) {
          logStep("ERROR: Could not resolve user_id for subscription event");
          break;
        }

        await upsertSubscription(supabaseAdmin, userId, sub);

        if (["active", "trialing"].includes(sub.status)) {
          const tier = determineTier(sub);
          await activateTier(supabaseAdmin, userId, tier);
        } else if (["canceled", "unpaid", "incomplete_expired"].includes(sub.status)) {
          await deactivatePlus(supabaseAdmin, userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subId: sub.id });

        const userId = await resolveUserId(
          supabaseAdmin, stripe,
          sub.metadata as Record<string, string>,
          sub.customer as string
        );
        if (!userId) break;

        await supabaseAdmin.from("stripe_subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);

        await deactivatePlus(supabaseAdmin, userId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });
        break;
      }

      default:
        logStep("Unhandled event", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
