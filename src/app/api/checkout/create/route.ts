import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, getStripeMode } from '@/lib/stripe/checkout';

/**
 * POST /api/checkout/create
 * Creates a Stripe Checkout Session
 *
 * Automatically detects environment:
 * - mock: Invalid/missing STRIPE_SECRET_KEY
 * - staging: STRIPE_SECRET_KEY starts with sk_test_
 * - production: STRIPE_SECRET_KEY starts with sk_live_
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid cart items' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.priceId || !item.quantity) {
        return NextResponse.json(
          { error: 'Invalid item data' },
          { status: 400 }
        );
      }

      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid quantity' },
          { status: 400 }
        );
      }

      // Stock validation
      if (item.stock !== undefined && item.quantity > item.stock) {
        return NextResponse.json(
          {
            error: 'Insufficient stock',
            details: [
              {
                productId: item.productId,
                issue: `Only ${item.stock} available`,
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Create checkout session (mode-aware)
    const session = await createCheckoutSession(items);

    // Calculate total for logging
    const total = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );

    // Log checkout creation
    console.log('🛒 Checkout Session Created:', {
      mode: session.mode,
      sessionId: session.id,
      items: items.length,
      total: `RM ${(total / 100).toFixed(2)}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
