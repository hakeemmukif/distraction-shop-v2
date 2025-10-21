import { NextRequest, NextResponse } from 'next/server';

// Default schedule (used if SHOP_SCHEDULE env var not set)
const DEFAULT_SCHEDULE = {
  timezone: 'Asia/Kuala_Lumpur',
  schedule: {
    monday: { open: '10:00', close: '18:00' },
    tuesday: { open: '10:00', close: '18:00' },
    wednesday: { open: '10:00', close: '18:00' },
    thursday: { open: '10:00', close: '18:00' },
    friday: { open: '10:00', close: '18:00' },
    saturday: { open: '11:00', close: '17:00' },
    sunday: { closed: true },
  },
  overrideStatus: null, // 'open' | 'closed' | null
};

type DaySchedule = { open: string; close: string } | { closed: true };
type WeekSchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

type ShopConfig = {
  timezone: string;
  schedule: WeekSchedule;
  overrideStatus: 'open' | 'closed' | null;
};

/**
 * Check if shop is currently open based on schedule
 */
function isShopOpen(config: ShopConfig): {
  isOpen: boolean;
  message: string;
  nextStatusChange: string | null;
  currentTime: string;
  schedule: WeekSchedule;
} {
  const now = new Date();

  // Convert to configured timezone
  const currentTime = now.toLocaleString('en-US', {
    timeZone: config.timezone,
    hour12: false,
  });

  // Parse current time components
  const currentDate = new Date(currentTime);
  const dayOfWeek = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: config.timezone,
  }).toLowerCase() as keyof WeekSchedule;

  const currentHour = currentDate.getHours();
  const currentMinute = currentDate.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Check override status first
  if (config.overrideStatus === 'open') {
    return {
      isOpen: true,
      message: 'Shop is open (manual override)',
      nextStatusChange: null,
      currentTime: currentDate.toISOString(),
      schedule: config.schedule,
    };
  }

  if (config.overrideStatus === 'closed') {
    return {
      isOpen: false,
      message: 'Shop is closed (manual override)',
      nextStatusChange: null,
      currentTime: currentDate.toISOString(),
      schedule: config.schedule,
    };
  }

  // Get today's schedule
  const todaySchedule = config.schedule[dayOfWeek];

  // Check if shop is closed today
  if ('closed' in todaySchedule && todaySchedule.closed) {
    return {
      isOpen: false,
      message: 'Shop is closed today',
      nextStatusChange: null,
      currentTime: currentDate.toISOString(),
      schedule: config.schedule,
    };
  }

  // Parse open/close times
  const openSchedule = todaySchedule as { open: string; close: string };
  const [openHour, openMinute] = openSchedule.open.split(':').map(Number);
  const [closeHour, closeMinute] = openSchedule.close.split(':').map(Number);

  const openTimeMinutes = openHour * 60 + openMinute;
  const closeTimeMinutes = closeHour * 60 + closeMinute;

  // Determine if currently open
  const isOpen = currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes;

  // Calculate next status change
  let nextStatusChange: string | null = null;
  if (isOpen) {
    // Next change is closing time today
    const closeTime = new Date(currentDate);
    closeTime.setHours(closeHour, closeMinute, 0, 0);
    nextStatusChange = closeTime.toISOString();
  } else if (currentTimeMinutes < openTimeMinutes) {
    // Next change is opening time today
    const openTime = new Date(currentDate);
    openTime.setHours(openHour, openMinute, 0, 0);
    nextStatusChange = openTime.toISOString();
  }

  return {
    isOpen,
    message: isOpen ? 'Shop is open' : 'Shop is currently closed',
    nextStatusChange,
    currentTime: currentDate.toISOString(),
    schedule: config.schedule,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Read schedule from environment variable or use default
    let config: ShopConfig = DEFAULT_SCHEDULE;

    if (process.env.SHOP_SCHEDULE) {
      try {
        config = JSON.parse(process.env.SHOP_SCHEDULE);
      } catch (error) {
        console.error('Failed to parse SHOP_SCHEDULE env var, using default:', error);
      }
    }

    const status = isShopOpen(config);

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error('Error checking shop status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check shop status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
