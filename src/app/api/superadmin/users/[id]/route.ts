import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/prisma';

/**
 * DELETE /api/superadmin/users/[id]
 * Delete admin user (Superadmin only)
 *
 * Security checks:
 * - Cannot delete yourself
 * - Cannot delete other superadmins
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get user ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Security check: Cannot delete yourself
    if (id === decoded.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Fetch user to delete
    const userToDelete = await prisma.user.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Security check: Cannot delete other superadmins
    if (userToDelete.role === 'superadmin') {
      return NextResponse.json(
        { error: 'Cannot delete superadmin accounts' },
        { status: 403 }
      );
    }

    // Delete user and their sessions (cascade)
    await prisma.user.delete({
      where: { id },
    });

    console.log('✅ User deleted:', {
      id: userToDelete.id,
      email: userToDelete.email,
      role: userToDelete.role,
      deletedBy: decoded.email,
    });

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: userToDelete.id,
        email: userToDelete.email,
        role: userToDelete.role,
      },
    });
  } catch (error) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
