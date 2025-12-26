import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const orderNumber = searchParams.get('orderNumber');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'No orders found for this email' },
        { status: 404 }
      );
    }

    // Build query
    const where: Prisma.OrderWhereInput = { customerId: customer.id };
    if (orderNumber) {
      where.orderNumber = orderNumber;
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'No orders found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Order lookup error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
