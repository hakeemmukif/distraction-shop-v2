import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWTEdge } from '@/lib/auth/jwt-edge';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const user = await verifyJWTEdge(token);

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (pathname.startsWith('/superadmin') && user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden: Superadmin access required' },
        { status: 403 }
      );
    }

    if (pathname.startsWith('/admin') && !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*'],
};
