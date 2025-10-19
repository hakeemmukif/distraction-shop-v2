import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './jwt';

export async function requireAuth(
  request: NextRequest,
  roles: ('admin' | 'superadmin')[] = []
) {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return {
      error: 'Unauthorized',
      status: 401,
      user: null,
    };
  }

  const user = verifyJWT(token);

  if (!user) {
    return {
      error: 'Invalid token',
      status: 401,
      user: null,
    };
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return {
      error: 'Forbidden',
      status: 403,
      user: null,
    };
  }

  return {
    error: null,
    status: 200,
    user,
  };
}
