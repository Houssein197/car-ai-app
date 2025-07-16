import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { priceId, customerEmail, userId, plan } = req.body;

    if (!priceId || !customerEmail || !userId || !plan) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`;
    console.log('Stripe Checkout URLs:', { successUrl, cancelUrl });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: plan === "one-time" ? "payment" : "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe Checkout Session Error:", error);
    return res.status(500).json({ error: "Error creating checkout session" });
  }
}
