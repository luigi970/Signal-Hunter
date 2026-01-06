# Signal-Hunter

## Descripción General

Signal-Hunter es un panel de control diseñado para descubrir y analizar problemas potenciales aprovechando tecnologías de inteligencia artificial de vanguardia. Utiliza la API de Firecrawl para rastrear y recopilar datos de la web, procesa y analiza esa información utilizando el poder de Gemini, y gestiona los datos y la autenticación de usuarios a través de un backend de Supabase.

El objetivo de este proyecto es proporcionar a los usuarios una herramienta poderosa para identificar señales y oportunidades a partir de grandes volúmenes de información, todo presentado en un panel de control intuitivo.

## Guía de Integración con Stripe

Aquí tienes una guía paso a paso para integrar Stripe en tu aplicación y gestionar suscripciones o pagos.

### Paso 1: Configuración de Stripe y Supabase

1.  **Crea una cuenta de Stripe:**
    *   Ve a [Stripe](https://dashboard.stripe.com/register) y crea una cuenta.
    *   Obtén tus claves de API: una **clave publicable** (Publishable Key) y una **clave secreta** (Secret Key). Las encontrarás en la sección de "Desarrolladores".

2.  **Configura tu base de datos de Supabase:**
    *   Crea una nueva tabla en tu base de datos para almacenar la información de las suscripciones de los usuarios. Podrías llamarla `subscriptions`.
    *   Columnas recomendadas:
        *   `user_id` (UUID, Foreign Key a `auth.users.id`)
        *   `stripe_customer_id` (text)
        *   `stripe_subscription_id` (text)
        *   `status` (text, por ejemplo: 'active', 'canceled', 'incomplete')

3.  **Guarda tu clave secreta de Stripe en Supabase:**
    *   Nunca expongas tu clave secreta en el lado del cliente. Guárdala de forma segura en los secretos de Supabase.
    *   Instala la CLI de Supabase si aún no lo has hecho.
    *   Ejecuta el siguiente comando:
        ```bash
        supabase secrets set STRIPE_SECRET_KEY=tu_clave_secreta_aqui
        ```

### Paso 2: Backend - Crear Sesiones de Checkout (Supabase Edge Functions)

Crearemos una función en el borde (Edge Function) para generar una sesión de pago de Stripe.

1.  **Crea una nueva función:**
    ```bash
    supabase functions new create-checkout-session
    ```

2.  **Escribe el código de la función (`/supabase/functions/create-checkout-session/index.ts`):**
    *   Necesitarás el cliente oficial de Stripe para Node.js: `npm install --save stripe`.
    *   Asegúrate de que `stripe` esté en el `package.json` de tu función.

    ```typescript
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
    ```

### Paso 3: Frontend - Iniciar el Checkout (React)

1.  **Instala las librerías de Stripe para React:**
    ```bash
    npm install @stripe/react-stripe-js @stripe/stripe-js
    ```

2.  **Carga Stripe en tu aplicación:**
    *   Envuelve tu componente principal (o el componente de pago) con `Elements` de Stripe.

    ```tsx
    // En tu archivo principal, por ejemplo, App.tsx
    import { Elements } from '@stripe/react-stripe-js';
    import { loadStripe } from '@stripe/stripe-js';

    const stripePromise = loadStripe('tu_clave_publicable_aqui');

    function App() {
      return (
        <Elements stripe={stripePromise}>
          {/* El resto de tu aplicación */}
        </Elements>
      );
    }
    ```

3.  **Crea un botón de pago:**
    *   Este componente llamará a tu Edge Function para crear la sesión y luego redirigirá al usuario a la página de pago de Stripe.

    ```tsx
    // components/SubscribeButton.tsx
    import { useStripe } from '@stripe/react-stripe-js';
    import { supabase } from '../lib/supabase'; // Tu cliente de Supabase

    const SubscribeButton = ({ priceId }) => {
      const stripe = useStripe();

      const handleCheckout = async () => {
        if (!stripe) return;

        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { priceId },
        });

        if (error) {
          console.error('Error al crear la sesión de checkout:', error);
          return;
        }

        const { sessionId } = data;
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

        if (stripeError) {
          console.error('Error al redirigir a Stripe:', stripeError.message);
        }
      };

      return <button onClick={handleCheckout}>Suscribirse</button>;
    };

    export default SubscribeButton;
    ```

### Paso 4: Webhooks - Gestionar el Estado de la Suscripción

Stripe te notificará sobre eventos (como un pago exitoso) a través de webhooks.

1.  **Crea una Edge Function para el webhook:**
    ```bash
    supabase functions new stripe-webhook
    ```

2.  **Guarda el secreto de firma del Webhook de Stripe en Supabase:**
    *   Obtén el secreto de firma del webhook desde tu panel de Stripe (normalmente en la configuración del webhook que crees).
    *   Guárdalo de forma segura en los secretos de Supabase.
    *   Ejecuta el siguiente comando:
        ```bash
        supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=whsec_tu_secreto_aqui
        ```

3.  **Escribe el código de la función (`/supabase/functions/stripe-webhook/index.ts`):**
    *   Esta función escuchará los eventos de Stripe y actualizará tu base de datos.

    ```typescript
    import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
    import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
      apiVersion: "2022-11-15",
      httpClient: Stripe.createFetchHttpClient(),
    });

    serve(async (req) => {
      const signature = req.headers.get("Stripe-Signature");
      const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
      const body = await req.text();

      let event;
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, signingSecret);
      } catch (err) {
        return new Response(err.message, { status: 400 });
      }

      // Lógica para manejar el evento
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        // Lógica para actualizar la tabla 'subscriptions' en Supabase
        // Ejemplo:
        // const { data, error } = await supabase.from('subscriptions').update({ status: 'active' }).eq('stripe_customer_id', session.customer);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    });
    ```

3.  **Configura el endpoint del webhook en Stripe:**
    *   En tu panel de Stripe, ve a "Desarrolladores" -> "Webhooks".
    *   Añade un nuevo endpoint y pega la URL de tu función de Supabase.
    *   Selecciona los eventos que quieres escuchar.

    #### Eventos de Webhook
    Para una integración mínima, solo necesitas el evento `checkout.session.completed`. Sin embargo, para gestionar adecuadamente el ciclo de vida de las suscripciones, se recomienda habilitar los siguientes eventos:

    *   **Mínimo indispensable:**
        *   `checkout.session.completed`: Se dispara cuando un cliente completa el proceso de pago. Es esencial para activar la suscripción inicial.

    *   **Recomendado para una gestión completa:**
        *   `invoice.payment_succeeded`: Para confirmar cada pago de renovación de la suscripción y asegurar la continuidad del servicio.
        *   `invoice.payment_failed`: Para tomar acciones cuando un pago de renovación falla (por ejemplo, notificar al usuario o restringir el acceso).
        *   `customer.subscription.deleted`: Se activa cuando un cliente cancela su suscripción. Es crucial para revocar el acceso al servicio.
        *   `customer.subscription.updated`: Para gestionar cambios en la suscripción, como mejoras o degradaciones de plan.