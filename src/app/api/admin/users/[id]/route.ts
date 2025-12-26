import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/middleware';

// DELETE /api/admin/users/:id - Delete user (superadmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['superadmin']);

  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    // Prevent deleting yourself
    if (id === auth.user!.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting other superadmins
    if (userToDelete.role === 'superadmin') {
      return NextResponse.json(
        { error: 'Cannot delete superadmin accounts' },
        { status: 403 }
      );
    }

    // Delete user (cascade will delete sessions)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
