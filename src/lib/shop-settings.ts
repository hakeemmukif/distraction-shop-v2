// In-memory storage for shop settings
// In production, this should be stored in a database or environment variables

interface DaySchedule {
  open: string;
  close: string;
  closed?: boolean;
}

interface ShopSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface ShopSettings {
  schedule: ShopSchedule;
  timezone: string;
  contactEmail: string;
}

// Default shop schedule
const defaultSchedule: ShopSchedule = {
  monday: { open: '10:00', close: '18:00' },
  tuesday: { open: '10:00', close: '18:00' },
  wednesday: { open: '10:00', close: '18:00' },
  thursday: { open: '10:00', close: '18:00' },
  friday: { open: '10:00', close: '18:00' },
  saturday: { open: '11:00', close: '17:00' },
  sunday: { closed: true, open: '00:00', close: '00:00' },
};

let shopSettings: ShopSettings = {
  schedule: defaultSchedule,
  timezone: 'Asia/Kuala_Lumpur',
  contactEmail: 'hello@distractionshop.com',
};

export function getShopSettings(): ShopSettings {
  return shopSettings;
}

export function updateShopSettings(settings: Partial<ShopSettings>): void {
  shopSettings = {
    ...shopSettings,
    ...settings,
  };
}

export function resetShopSettings(): void {
  shopSettings = {
    schedule: defaultSchedule,
    timezone: 'Asia/Kuala_Lumpur',
    contactEmail: 'hello@distractionshop.com',
  };
}
