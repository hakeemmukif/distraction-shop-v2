'use client';

import { useEffect, useState } from 'react';

type ToggleProps = {
  onToggle?: () => void;
};

export default function ShopToggle({ onToggle }: ToggleProps) {
  const [override, setOverride] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Only render in non-production environments
  const isDev = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    // Fetch current override state on mount
    async function fetchOverride() {
      try {
        const response = await fetch('/api/shop/toggle');
        const data = await response.json();
        setOverride(data.override);
      } catch (error) {
        console.error('Failed to fetch toggle state:', error);
      }
    }
    fetchOverride();
  }, []);

  async function handleToggle(newOverride: boolean | null) {
    setLoading(true);
    try {
      const response = await fetch('/api/shop/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ override: newOverride }),
      });

      const data = await response.json();
      if (data.success) {
        setOverride(data.override);
        if (onToggle) onToggle();
      }
    } catch (error) {
      console.error('Failed to toggle shop status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isDev) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-xl">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-white text-sm font-medium">Dev Toggle</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {override === true
                ? 'OPEN'
                : override === false
                ? 'CLOSED'
                : 'SCHEDULE'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleToggle(true)}
            disabled={loading}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              override === true
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            Force Open
          </button>
          <button
            onClick={() => handleToggle(false)}
            disabled={loading}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              override === false
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            Force Close
          </button>
          <button
            onClick={() => handleToggle(null)}
            disabled={loading}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              override === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
