import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { Prisma, OrderStatus } from '@prisma/client';

// GET /api/admin/orders - Fetch orders from database (superadmin only)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['superadmin']);

  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: Prisma.OrderWhereInput = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as OrderStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Fetch orders with items
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          customer: {
            select: {
              email: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      limit,
      offset,
      hasMore: offset + orders.length < total,
    });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
