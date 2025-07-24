import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Stripe signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const plan = session.metadata?.plan || "unknown";
    const stripeCustomerId = session.customer;
    const stripeSubscriptionId = session.subscription;

    if (!userId) {
      console.error("❌ No userId (client_reference_id) in session.");
      return res.status(400).send("Missing userId");
    }

    const creditsByPlan = {
      "one-time": 10,
      "basic": 100,
      "pro": 250,
    };
    const credits = creditsByPlan[plan] || 0;

    console.log("📦 Webhook received:", {
      userId,
      plan,
      credits,
      stripeCustomerId,
      stripeSubscriptionId,
    });

    // 1. Update or insert into subscriptions
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (subscriptionError) {
      console.error("❌ Failed to update subscriptions table:", subscriptionError.message);
      return res.status(500).send("Subscription update failed");
    }

    // 2. Update or insert into credits
    const { error: creditError } = await supabase
      .from("credits")
      .upsert(
        {
          user_id: userId,
          balance: credits,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (creditError) {
      console.error("❌ Failed to update credits table:", creditError.message);
      return res.status(500).send("Credits update failed");
    }

    console.log("✅ Stripe webhook processed: subscriptions and credits updated");
    return res.status(200).send("✅ Stripe data updated");
  }

  res.status(200).send("Webhook received (no action)");
}
