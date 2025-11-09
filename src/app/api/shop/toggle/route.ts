import { NextRequest, NextResponse } from 'next/server';
import { getShopOverride, setShopOverride } from '@/lib/shop-override';

export function GET() {
  return NextResponse.json({ override: getShopOverride() }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { override } = body;

    if (override !== true && override !== false && override !== null) {
      return NextResponse.json(
        { error: 'Invalid override value. Must be true, false, or null' },
        { status: 400 }
      );
    }

    setShopOverride(override);

    return NextResponse.json(
      {
        success: true,
        override: getShopOverride(),
        message:
          override === null
            ? 'Using schedule'
            : override
            ? 'Shop forced OPEN'
            : 'Shop forced CLOSED',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error toggling shop status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle shop status' },
      { status: 500 }
    );
  }
}
