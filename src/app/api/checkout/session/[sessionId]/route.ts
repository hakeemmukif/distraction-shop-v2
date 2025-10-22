import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession } from '@/lib/stripe/checkout';

/**
 * GET /api/checkout/session/[sessionId]
 * Retrieve checkout session details
 *
 * Used by the success page to display order confirmation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session (mode-aware)
    const session = await getCheckoutSession(sessionId);

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to retrieve session:', error);
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }
}
