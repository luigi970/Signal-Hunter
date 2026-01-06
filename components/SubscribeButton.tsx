
import React from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase'; // Tu cliente de Supabase

const SubscribeButton = ({ priceId, isPro }: { priceId: string, isPro: boolean }) => {
  const stripe = useStripe();

  const handleCheckout = async () => {
    if (isPro) {
      alert("You are already a PRO user!");
      return;
    }
    if (!stripe) {
      console.log("Stripe.js has not loaded yet.");
      return;
    }

    console.log("Invoking Supabase function 'dynamic-service' with priceId:", priceId);

    const { data, error } = await supabase.functions.invoke('dynamic-service', {
      body: { priceId },
    });

    if (error) {
      console.error('Error creating checkout session:', error.message);
      alert(`Error: ${error.message}`);
      return;
    }

    console.log("Supabase function returned:", data);
    const { sessionId } = data;
    
    if (!sessionId) {
      console.error("No sessionId returned from function");
      alert("Error: Could not retrieve a session ID.");
      return;
    }

    const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

    if (stripeError) {
      console.error('Error redirecting to Stripe:', stripeError.message);
      alert(`Error: ${stripeError.message}`);
    }
  };

  return (
    <button 
      onClick={handleCheckout}
      disabled={isPro}
      className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPro ? "You are a PRO" : "Upgrade to PRO"}
    </button>
  );
};

export default SubscribeButton;
