import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { fetchOrders, exportOrdersToCSV } from '@/lib/stripe/orders';
import type { OrderFilters } from '@/types/order';

/**
 * GET /api/superadmin/orders
 * Fetch all orders (Superadmin only)
 *
 * Query parameters:
 * - limit: number (default: 25, max: 100)
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - status: 'complete' | 'expired' | 'open'
 * - paymentStatus: 'paid' | 'unpaid' | 'no_payment_required'
 * - search: string (search by email or order ID)
 * - export: 'csv' (optional, triggers CSV download)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify superadmin role
    if (decoded.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden - Superadmin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const filters: OrderFilters = {
      limit: Math.min(parseInt(searchParams.get('limit') || '25'), 100),
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      paymentStatus: (searchParams.get('paymentStatus') as any) || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Check if CSV export is requested
    const exportFormat = searchParams.get('export');

    // Fetch orders
    const ordersResponse = await fetchOrders(filters);

    // Handle CSV export
    if (exportFormat === 'csv') {
      const csv = exportOrdersToCSV(ordersResponse.orders);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON response
    return NextResponse.json(ordersResponse);
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
