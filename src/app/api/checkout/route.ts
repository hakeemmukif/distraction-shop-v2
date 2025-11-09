import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import Stripe from 'stripe';

interface CartItem {
  productId: string;
  name: string;
  price: number; // in MYR
  size: string;
  quantity: number;
  image: string;
}

interface Customer {
  email: string;
  name: string;
  phone: string;
}

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface Shipping {
  name: string;
  phone: string;
  address: ShippingAddress;
}

interface CheckoutRequest {
  items: CartItem[];
  customer: Customer;
  shipping: Shipping;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();

    // Validate request
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    if (!body.customer || !body.customer.email || !body.customer.name) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      );
    }

    if (!body.shipping || !body.shipping.address) {
      return NextResponse.json(
        { error: 'Shipping information is required' },
        { status: 400 }
      );
    }

    // Validate stock availability for each item
    const validationErrors: Array<{ productId: string; issue: string }> = [];

    for (const item of body.items) {
      if (!item.productId || !item.name || !item.price || !item.quantity) {
        validationErrors.push({
          productId: item.productId || 'unknown',
          issue: 'Missing required item information',
        });
        continue;
      }

      if (item.quantity <= 0) {
        validationErrors.push({
          productId: item.productId,
          issue: 'Quantity must be greater than 0',
        });
        continue;
      }

      try {
        const product = await stripe.products.retrieve(item.productId);

        if (!product.active) {
          validationErrors.push({
            productId: item.productId,
            issue: 'Product is not active',
          });
          continue;
        }

        // Check stock for the selected size
        if (item.size && item.size !== 'One Size') {
          const sizeKey = Object.keys(product.metadata).find(
            (key) =>
              key.startsWith('size_') &&
              !key.includes('stock') &&
              product.metadata[key] === item.size
          );

          if (sizeKey) {
            const stockKey = `${sizeKey}_stock`;
            const stock = parseInt(product.metadata[stockKey] || '0');

            if (stock < item.quantity) {
              validationErrors.push({
                productId: item.productId,
                issue: `Size ${item.size} has insufficient stock (available: ${stock})`,
              });
            }
          } else {
            validationErrors.push({
              productId: item.productId,
              issue: `Size ${item.size} not found`,
            });
          }
        }
      } catch (error) {
        validationErrors.push({
          productId: item.productId,
          issue: 'Product not found or invalid',
        });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid cart items', details: validationErrors },
        { status: 400 }
      );
    }

    // Find or create Stripe customer
    let stripeCustomer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: body.customer.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomer = existingCustomers.data[0];
    } else {
      stripeCustomer = await stripe.customers.create({
        email: body.customer.email,
        name: body.customer.name,
        phone: body.customer.phone,
      });
    }

    // Create line items - convert prices to cents for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = body.items.map(
      (item) => ({
        price_data: {
          currency: 'myr',
          product_data: {
            name: `${item.name} - ${item.size}`,
            images: [item.image],
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })
    );

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'fpx'],
      line_items: lineItems,
      customer: stripeCustomer.id,
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout`,
      // Enable Stripe's automatic receipt emails
      payment_intent_data: {
        receipt_email: body.customer.email,
      },
      metadata: {
        // Store order data for webhook to create database records
        customerEmail: body.customer.email,
        customerName: body.customer.name,
        customerPhone: body.customer.phone,
        shippingName: body.shipping.name,
        shippingPhone: body.shipping.phone,
        shippingAddressLine1: body.shipping.address.line1,
        shippingAddressLine2: body.shipping.address.line2 || '',
        shippingCity: body.shipping.address.city,
        shippingState: body.shipping.address.state,
        shippingPostalCode: body.shipping.address.postal_code,
        shippingCountry: body.shipping.address.country,
        items: JSON.stringify(
          body.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            size: item.size,
            quantity: item.quantity,
            image: item.image,
          }))
        ),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout session creation failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
