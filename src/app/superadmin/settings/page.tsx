'use client';

import { useState, useEffect } from 'react';

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

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/schedule');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (day: keyof ShopSchedule, field: keyof DaySchedule, value: string | boolean) => {
    if (!settings) return;

    setSettings({
      ...settings,
      schedule: {
        ...settings.schedule,
        [day]: {
          ...settings.schedule[day],
          [field]: value,
        },
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="text-center py-12 text-gray-500">Failed to load settings</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black">Shop Settings</h1>
        <p className="text-gray-600 mt-1">Configure shop schedule and contact information</p>
      </div>

      <form onSubmit={handleSave}>
        {/* Shop Schedule */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">Shop Schedule</h2>
          <p className="text-sm text-gray-600 mb-6">
            Set your weekly operating hours. Customers will see shop status based on this schedule.
          </p>

          <div className="space-y-4">
            {daysOfWeek.map((day) => {
              const daySchedule = settings.schedule[day];
              const isClosed = daySchedule.closed || false;

              return (
                <div key={day} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2">
                    <label className="font-medium text-black capitalize">{day}</label>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isClosed}
                        onChange={(e) => handleScheduleChange(day, 'closed', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">Closed</span>
                    </label>
                  </div>

                  <div className="col-span-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Open:</label>
                      <input
                        type="time"
                        value={daySchedule.open}
                        onChange={(e) => handleScheduleChange(day, 'open', e.target.value)}
                        disabled={isClosed}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Close:</label>
                      <input
                        type="time"
                        value={daySchedule.close}
                        onChange={(e) => handleScheduleChange(day, 'close', e.target.value)}
                        disabled={isClosed}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                id="contactEmail"
                value={settings.contactEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contactEmail: e.target.value,
                  })
                }
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="hello@distractionshop.com"
              />
              <p className="text-sm text-gray-500 mt-1">Email address for customer inquiries</p>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    timezone: e.target.value,
                  })
                }
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="Asia/Kuala_Lumpur">Asia/Kuala Lumpur (Malaysia)</option>
                <option value="Asia/Singapore">Asia/Singapore</option>
                <option value="Asia/Jakarta">Asia/Jakarta</option>
                <option value="UTC">UTC</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Used for shop schedule calculations</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div>
            {message && (
              <div
                className={`px-4 py-2 rounded ${
                  message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}
              >
                {message}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-6 py-3 rounded font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
