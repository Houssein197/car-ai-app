import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId = session.client_reference_id;
    const plan = session.metadata?.plan || "one-time"; // fallback if needed

    let newCredits = 0;
    if (plan === "one-time") newCredits = 10;
    if (plan === "basic") newCredits = 100;
    if (plan === "pro") newCredits = 250;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          plan,
          credits: newCredits,
        })
        .eq("id", userId);

      if (error) {
        console.error("❌ Supabase update error:", error);
        return res.status(500).send("Supabase update failed");
      }

      console.log(`✅ Updated user ${userId} to plan ${plan} with ${newCredits} credits`);
    } catch (err) {
      console.error("❌ Server error:", err);
      return res.status(500).send("Server error");
    }
  }

  res.status(200).json({ received: true });
}
