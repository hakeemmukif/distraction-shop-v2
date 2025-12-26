import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Find order by Stripe session ID
    const order = await prisma.order.findFirst({
      where: {
        stripeCheckoutSessionId: sessionId,
      },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found', found: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        customer: {
          email: order.customer.email,
          name: order.customer.name,
        },
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching order by session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order', found: false },
      { status: 500 }
    );
  }
}
