import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const { priceId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${Deno.env.get("SITE_URL")}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get("SITE_URL")}/dashboard`,
  });

  return new Response(JSON.stringify({ sessionId: session.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
