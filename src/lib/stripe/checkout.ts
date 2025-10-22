/**
 * Stripe Checkout Utilities
 * Automatically detects environment mode based on STRIPE_SECRET_KEY
 */

type CheckoutMode = 'mock' | 'staging' | 'production';

interface CheckoutItem {
  productId: string;
  priceId: string;
  name: string;
  price: number; // cents
  quantity: number;
  size: string | null;
  image: string;
  stock?: number;
}

interface CheckoutSession {
  id: string;
  url: string;
  mode: CheckoutMode;
}

/**
 * Detect environment mode based on Stripe secret key
 */
export function getStripeMode(): CheckoutMode {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey === 'sk_test_dummy' || secretKey.length < 20) {
    return 'mock';
  }

  if (secretKey.startsWith('sk_test_')) {
    return 'staging';
  }

  if (secretKey.startsWith('sk_live_')) {
    return 'production';
  }

  return 'mock';
}

/**
 * Create checkout session (mode-aware)
 */
export async function createCheckoutSession(
  items: CheckoutItem[]
): Promise<CheckoutSession> {
  const mode = getStripeMode();
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  if (mode === 'mock') {
    // Mock mode: Generate fake session
    const sessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: sessionId,
      url: `${baseUrl}/success?session_id=${sessionId}`,
      mode: 'mock',
    };
  }

  // Staging or Production mode: Use real Stripe
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'fpx'],
      line_items: items.map((item) => {
        // If item has a size, we need to create inline price data
        // because Stripe prices don't have size variants
        if (item.size) {
          return {
            price_data: {
              currency: 'myr',
              product_data: {
                name: `${item.name} - Size ${item.size}`,
                images: [item.image],
                metadata: {
                  size: item.size,
                  product_id: item.productId,
                },
              },
              unit_amount: item.price,
            },
            quantity: item.quantity,
          };
        }

        // No size: use existing price ID
        return {
          price: item.priceId,
          quantity: item.quantity,
        };
      }),
      shipping_address_collection: {
        allowed_countries: ['MY'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: 'Free Shipping',
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'myr' },
          },
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/home`,
      metadata: {
        environment: mode,
      },
    });

    return {
      id: session.id,
      url: session.url!,
      mode,
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw new Error('Failed to create checkout session');
  }
}

/**
 * Retrieve checkout session (mode-aware)
 */
export async function getCheckoutSession(sessionId: string) {
  const mode = getStripeMode();

  if (mode === 'mock') {
    // Mock mode: Return fake session data
    return {
      id: sessionId,
      customer_details: {
        email: 'customer@example.com',
        name: 'Mock Customer',
      },
      amount_total: 20000, // RM 200.00
      currency: 'myr',
      payment_status: 'paid',
      status: 'complete',
      created: Date.now() / 1000,
      metadata: {
        environment: 'mock',
      },
    };
  }

  // Staging or Production mode: Use real Stripe
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    });

    return session;
  } catch (error) {
    console.error('Failed to retrieve session:', error);
    throw new Error('Session not found');
  }
}

/**
 * Verify webhook signature (mode-aware)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): any {
  const mode = getStripeMode();

  if (mode === 'mock') {
    // Mock mode: Skip signature verification
    return JSON.parse(payload);
  }

  // Staging or Production mode: Verify signature
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}
