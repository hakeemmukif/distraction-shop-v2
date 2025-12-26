import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/middleware';
import { getShopSettings, updateShopSettings } from '@/lib/shop-settings';

const dayScheduleSchema = z.object({
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  closed: z.boolean().optional(),
});

const updateScheduleSchema = z.object({
  schedule: z.object({
    monday: dayScheduleSchema,
    tuesday: dayScheduleSchema,
    wednesday: dayScheduleSchema,
    thursday: dayScheduleSchema,
    friday: dayScheduleSchema,
    saturday: dayScheduleSchema,
    sunday: dayScheduleSchema,
  }),
  timezone: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

// GET /api/admin/settings/schedule - Get shop schedule (superadmin only)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['superadmin']);

  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = getShopSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/schedule - Update shop schedule (superadmin only)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request, ['superadmin']);

  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const validatedData = updateScheduleSchema.parse(body);

    updateShopSettings(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: getShopSettings(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
