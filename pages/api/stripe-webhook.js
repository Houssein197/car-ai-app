import Stripe from "stripe";
import { buffer } from "micro";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: { bodyParser: false },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const priceIdToPlan = {
  "price_1RknfnCcxLeRC3tnGcqnb9Ft": "one-time",
  "price_1Rkng8CcxLeRC3tneNBlFXmc": "basic",
  "price_1RkngVCcxLeRC3tn3AhFXshU": "pro",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const priceId = session.line_items ? session.line_items[0].price.id : session.metadata?.priceId;
    // Fallback: try to get from session.display_items or metadata if needed
    const plan = priceIdToPlan[priceId] || null;
    if (userId && plan) {
      // Update the user's plan in Supabase profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ plan })
        .eq("id", userId);
      if (error) {
        console.error("Failed to update user plan in Supabase:", error.message);
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ received: true });
    } else {
      console.error("Missing userId or plan in Stripe session.", { userId, plan, priceId });
      return res.status(400).json({ error: "Missing userId or plan" });
    }
  }

  res.status(200).json({ received: true });
} 