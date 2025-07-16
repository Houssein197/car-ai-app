import { buffer } from 'micro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Error verifying Stripe webhook signature:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const userId = session.client_reference_id;
    const plan = session.metadata?.plan || 'unknown';

    console.log('✅ Stripe session completed for user:', userId, 'with plan:', plan);

    // Define credits based on plan
    const creditsByPlan = {
      'one-time': 10,
      'basic': 100,
      'pro': 250,
    };

    const credits = creditsByPlan[plan] || 0;

    // Update Supabase profile
    const { error } = await supabase
      .from('profiles')
      .update({ plan, credits })
      .eq('id', userId);

    if (error) {
      console.error('❌ Supabase update failed:', error.message);
      return res.status(500).send('Supabase update failed');
    }

    console.log('✅ Supabase updated successfully for user:', userId);
    return res.status(200).send('✅ Supabase updated successfully');
  }

  res.status(200).send('Webhook received');
}
