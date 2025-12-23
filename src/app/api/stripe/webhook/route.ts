import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { stripe } from '@/lib/stripe/client';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Helper to generate order number with cryptographically secure randomness
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Helper to decrement stock in Stripe product metadata
async function decrementProductStock(productId: string, size: string, quantity: number) {
  try {
    const product = await stripe.products.retrieve(productId);

    if (size === 'One Size') {
      // For products without sizes, just log (you may want to add a general stock field)
      console.log(`Stock decrement for ${productId}: ${quantity} units`);
      return;
    }

    // Find the size in metadata
    const sizeKey = Object.keys(product.metadata).find(
      (key) =>
        key.startsWith('size_') &&
        !key.includes('stock') &&
        product.metadata[key] === size
    );

    if (sizeKey) {
      const stockKey = `${sizeKey}_stock`;
      const currentStock = parseInt(product.metadata[stockKey] || '0');
      const newStock = Math.max(0, currentStock - quantity);

      // Update product metadata with new stock
      await stripe.products.update(productId, {
        metadata: {
          ...product.metadata,
          [stockKey]: newStock.toString(),
        },
      });

      console.log(`Stock updated for ${productId} - ${size}: ${currentStock} → ${newStock}`);
    }
  } catch (error) {
    console.error(`Failed to decrement stock for ${productId}:`, error);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('Processing checkout.session.completed:', session.id);

        // Parse items from metadata with error handling
        let items;
        try {
          items = JSON.parse(session.metadata?.items || '[]');
        } catch (parseError) {
          console.error('Failed to parse items from metadata:', parseError);
          items = [];
        }

        if (items.length === 0) {
          console.error('No items found in session metadata');
          break;
        }

        // Create or find customer
        let customer = await prisma.customer.findUnique({
          where: { email: session.metadata?.customerEmail || '' },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              email: session.metadata?.customerEmail || '',
              name: session.metadata?.customerName || null,
              phone: session.metadata?.customerPhone || null,
            },
          });
        }

        // Create order
        const orderNumber = generateOrderNumber();
        const total = (session.amount_total || 0) / 100; // Convert from cents

        const order = await prisma.order.create({
          data: {
            orderNumber,
            customerId: customer.id,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            status: 'completed',
            total,
            currency: (session.currency || 'myr').toUpperCase(),
            customerEmail: session.metadata?.customerEmail || '',
            customerName: session.metadata?.customerName || null,
            shippingName: session.metadata?.shippingName || '',
            shippingPhone: session.metadata?.shippingPhone || '',
            shippingAddressLine1: session.metadata?.shippingAddressLine1 || '',
            shippingAddressLine2: session.metadata?.shippingAddressLine2 || null,
            shippingCity: session.metadata?.shippingCity || '',
            shippingState: session.metadata?.shippingState || '',
            shippingPostalCode: session.metadata?.shippingPostalCode || '',
            shippingCountry: session.metadata?.shippingCountry || 'MY',
          },
        });

        // Create order items and decrement stock
        for (const item of items) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              name: item.name,
              size: item.size,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
              image: item.image,
            },
          });

          // Decrement stock in Stripe
          await decrementProductStock(item.productId, item.size, item.quantity);
        }

        console.log(`Order created successfully: ${orderNumber}`);

        // Note: Stripe automatically sends payment receipt emails
        // No need for custom email implementation

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log('Payment succeeded:', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.error('Payment failed:', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          lastPaymentError: paymentIntent.last_payment_error,
        });

        // Update order status to failed if it exists
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'failed' },
          });
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
