import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/hash';
import prisma from '@/lib/prisma';

/**
 * GET /api/superadmin/users
 * List all admin users (Superadmin only)
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

    // Fetch all users (excluding password hash)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        createdBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/users
 * Create new admin user (Superadmin only)
 *
 * Body:
 * {
 *   email: string (required)
 *   password: string (required, min 8 chars)
 *   role: 'admin' | 'superadmin' (required)
 * }
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { email, password, role } = body;

    // Validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!role || !['admin', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be admin or superadmin' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        createdBy: decoded.userId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('✅ User created:', {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      createdBy: decoded.email,
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('Create user API error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
