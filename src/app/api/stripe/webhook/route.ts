import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, getStripeMode } from '@/lib/stripe/checkout';

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 *
 * Automatically detects environment and verifies signatures accordingly:
 * - mock: Skips signature verification
 * - staging/production: Verifies webhook signature with STRIPE_WEBHOOK_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature && getStripeMode() !== 'mock') {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature (mode-aware)
    const event = verifyWebhookSignature(body, signature || '');

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: any) {
  const mode = getStripeMode();

  console.log('✅ Checkout Session Completed:', {
    mode,
    sessionId: session.id,
    customerEmail: session.customer_details?.email,
    amountTotal: session.amount_total,
    currency: session.currency,
    paymentStatus: session.payment_status,
    timestamp: new Date().toISOString(),
  });

  // TODO: In production, you might want to:
  // 1. Send order confirmation email via Resend
  // 2. Update inventory in Stripe product metadata
  // 3. Trigger fulfillment process
  // 4. Store order record (if using database)

  // Example email sending (with Resend):
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  //
  // await resend.emails.send({
  //   from: 'Distraction Shop <orders@distractionshop.com>',
  //   to: session.customer_details.email,
  //   subject: 'Order Confirmation',
  //   html: renderOrderConfirmationEmail(session),
  // });
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const mode = getStripeMode();

  console.log('💳 Payment Intent Succeeded:', {
    mode,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    timestamp: new Date().toISOString(),
  });

  // Payment succeeded - order can be fulfilled
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: any) {
  const mode = getStripeMode();

  console.error('❌ Payment Intent Failed:', {
    mode,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    failureCode: paymentIntent.last_payment_error?.code,
    failureMessage: paymentIntent.last_payment_error?.message,
    timestamp: new Date().toISOString(),
  });

  // Payment failed - notify customer or retry
  // TODO: Send payment failed notification email
}
