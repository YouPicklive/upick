import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    
    logStep("Secrets verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR: No stripe-signature header");
      return new Response("No signature", { status: 400, headers: corsHeaders });
    }

    // Get the raw body
    const body = await req.text();
    logStep("Body received", { length: body.length });

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("ERROR: Webhook signature verification failed", { error: errorMessage });
      return new Response(`Webhook signature verification failed: ${errorMessage}`, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { 
          sessionId: session.id, 
          customerEmail: session.customer_email,
          customerId: session.customer,
          mode: session.mode
        });

        // Get customer email
        let customerEmail = session.customer_email;
        
        // If no email on session, try to get from customer object
        if (!customerEmail && session.customer) {
          const customer = await stripe.customers.retrieve(session.customer as string);
          if (!customer.deleted) {
            customerEmail = customer.email;
          }
        }

        if (!customerEmail) {
          logStep("ERROR: No customer email found");
          return new Response("No customer email", { status: 400, headers: corsHeaders });
        }

        logStep("Customer email found", { email: customerEmail });

        // Find the user by email
        const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (userError) {
          logStep("ERROR: Failed to list users", { error: userError.message });
          throw new Error(`Failed to list users: ${userError.message}`);
        }

        const user = users.users.find(u => u.email === customerEmail);
        if (!user) {
          logStep("ERROR: No user found with email", { email: customerEmail });
          return new Response("User not found", { status: 404, headers: corsHeaders });
        }

        logStep("User found", { userId: user.id });

        // Activate Plus membership
        const { error: updateError } = await supabaseAdmin
          .from("user_entitlements")
          .upsert({
            user_id: user.id,
            plus_active: true,
            updated_at: new Date().toISOString(),
          }, { 
            onConflict: "user_id" 
          });

        if (updateError) {
          logStep("ERROR: Failed to update entitlements", { error: updateError.message });
          throw new Error(`Failed to update entitlements: ${updateError.message}`);
        }

        logStep("Plus membership activated successfully", { userId: user.id });
        break;
      }

      case "customer.subscription.deleted": {
        // Handle subscription cancellation
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted || !customer.email) {
          logStep("Customer deleted or no email");
          break;
        }

        // Find the user by email
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users.find(u => u.email === customer.email);
        
        if (user) {
          // Deactivate Plus membership
          await supabaseAdmin
            .from("user_entitlements")
            .update({ plus_active: false, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
          
          logStep("Plus membership deactivated", { userId: user.id });
        }
        break;
      }

      case "invoice.payment_failed": {
        // Handle failed payment
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id, customerEmail: invoice.customer_email });
        // Could send email notification, but for now just log
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
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
