/**
 * Order Management Utilities
 * Handles fetching and processing orders from Stripe (mode-aware)
 */

import { getStripeMode } from './checkout';
import type { Order, OrdersResponse, OrderFilters, OrderLineItem } from '@/types/order';

/**
 * Generate mock orders for development
 */
function generateMockOrders(limit: number = 10): Order[] {
  const mockOrders: Order[] = [];
  const now = Date.now() / 1000;

  for (let i = 0; i < limit; i++) {
    const orderId = `cs_mock_order_${Date.now()}_${i}`;
    const dayOffset = i * 86400; // 1 day in seconds

    mockOrders.push({
      id: orderId,
      customer: {
        email: `customer${i + 1}@example.com`,
        name: `Mock Customer ${i + 1}`,
        phone: '+60123456789',
      },
      shipping: {
        name: `Mock Customer ${i + 1}`,
        address: {
          line1: `${i + 1} Jalan Mock`,
          line2: null,
          city: 'Kuala Lumpur',
          state: 'Wilayah Persekutuan',
          postal_code: '50000',
          country: 'MY',
        },
      },
      line_items: [
        {
          id: `li_mock_${i}_1`,
          name: `Mock Product ${i + 1}`,
          description: 'Mock product for development',
          quantity: Math.floor(Math.random() * 3) + 1,
          amount: (Math.floor(Math.random() * 10) + 5) * 1000, // RM 50-150
          currency: 'myr',
          images: ['https://via.placeholder.com/150'],
        },
      ],
      amount_total: (Math.floor(Math.random() * 20) + 10) * 1000, // RM 100-300
      amount_subtotal: (Math.floor(Math.random() * 20) + 10) * 1000,
      currency: 'myr',
      status: i % 5 === 0 ? 'expired' : 'complete',
      payment_status: i % 5 === 0 ? 'unpaid' : 'paid',
      created: now - dayOffset,
      metadata: {
        environment: 'mock',
      },
    });
  }

  return mockOrders.sort((a, b) => b.created - a.created);
}

/**
 * Fetch orders from Stripe (mode-aware)
 */
export async function fetchOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
  const mode = getStripeMode();
  const limit = filters.limit || 25;

  if (mode === 'mock') {
    // Mock mode: Return generated mock data
    const mockOrders = generateMockOrders(limit);

    // Apply filters
    let filteredOrders = mockOrders;

    if (filters.status) {
      filteredOrders = filteredOrders.filter((order) => order.status === filters.status);
    }

    if (filters.paymentStatus) {
      filteredOrders = filteredOrders.filter(
        (order) => order.payment_status === filters.paymentStatus
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(
        (order) =>
          order.customer.email.toLowerCase().includes(searchLower) ||
          order.id.toLowerCase().includes(searchLower)
      );
    }

    return {
      orders: filteredOrders.slice(0, limit),
      total: filteredOrders.length,
      hasMore: filteredOrders.length > limit,
    };
  }

  // Staging or Production mode: Fetch from Stripe
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Build Stripe query parameters
    const queryParams: any = {
      limit,
      expand: ['data.line_items', 'data.customer'],
    };

    // Date filters (if provided)
    if (filters.startDate || filters.endDate) {
      queryParams.created = {};
      if (filters.startDate) {
        queryParams.created.gte = Math.floor(new Date(filters.startDate).getTime() / 1000);
      }
      if (filters.endDate) {
        queryParams.created.lte = Math.floor(new Date(filters.endDate).getTime() / 1000);
      }
    }

    // Fetch checkout sessions (completed orders)
    const sessions = await stripe.checkout.sessions.list(queryParams);

    // Transform Stripe sessions to our Order type
    const orders: Order[] = sessions.data
      .filter((session: any) => {
        // Apply status filter
        if (filters.status && session.status !== filters.status) {
          return false;
        }

        // Apply payment status filter
        if (filters.paymentStatus && session.payment_status !== filters.paymentStatus) {
          return false;
        }

        // Apply search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesEmail = session.customer_details?.email
            ?.toLowerCase()
            .includes(searchLower);
          const matchesId = session.id.toLowerCase().includes(searchLower);
          return matchesEmail || matchesId;
        }

        return true;
      })
      .map((session: any) => transformStripeSession(session));

    return {
      orders,
      total: orders.length,
      hasMore: sessions.has_more,
    };
  } catch (error) {
    console.error('Failed to fetch orders from Stripe:', error);
    throw new Error('Failed to fetch orders');
  }
}

/**
 * Fetch single order details (mode-aware)
 */
export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const mode = getStripeMode();

  if (mode === 'mock') {
    // Mock mode: Generate a single mock order
    const mockOrders = generateMockOrders(1);
    return mockOrders[0] || null;
  }

  // Staging or Production mode: Fetch from Stripe
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.retrieve(orderId, {
      expand: ['line_items', 'customer'],
    });

    return transformStripeSession(session);
  } catch (error) {
    console.error('Failed to fetch order from Stripe:', error);
    return null;
  }
}

/**
 * Transform Stripe checkout session to Order type
 */
function transformStripeSession(session: any): Order {
  // Extract line items
  const lineItems: OrderLineItem[] = session.line_items?.data?.map((item: any) => ({
    id: item.id,
    name: item.description || 'Unknown Product',
    description: item.price?.product?.description || null,
    quantity: item.quantity || 1,
    amount: item.amount_total || 0,
    currency: item.currency || 'myr',
    images: item.price?.product?.images || [],
  })) || [];

  return {
    id: session.id,
    customer: {
      email: session.customer_details?.email || 'Unknown',
      name: session.customer_details?.name || 'Unknown',
      phone: session.customer_details?.phone || null,
    },
    shipping: session.shipping_details
      ? {
          name: session.shipping_details.name,
          address: {
            line1: session.shipping_details.address.line1,
            line2: session.shipping_details.address.line2,
            city: session.shipping_details.address.city,
            state: session.shipping_details.address.state,
            postal_code: session.shipping_details.address.postal_code,
            country: session.shipping_details.address.country,
          },
        }
      : null,
    line_items: lineItems,
    amount_total: session.amount_total || 0,
    amount_subtotal: session.amount_subtotal || 0,
    currency: session.currency || 'myr',
    status: session.status || 'open',
    payment_status: session.payment_status || 'unpaid',
    created: session.created,
    metadata: session.metadata || {},
  };
}

/**
 * Export orders to CSV format
 */
export function exportOrdersToCSV(orders: Order[]): string {
  const headers = [
    'Order ID',
    'Date',
    'Customer Email',
    'Customer Name',
    'Status',
    'Payment Status',
    'Total (RM)',
    'Items',
  ];

  const rows = orders.map((order) => [
    order.id,
    new Date(order.created * 1000).toLocaleDateString('en-MY'),
    order.customer.email,
    order.customer.name,
    order.status,
    order.payment_status,
    (order.amount_total / 100).toFixed(2),
    order.line_items.length.toString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}
