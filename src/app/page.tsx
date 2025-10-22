'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ShopStatus = {
  isOpen: boolean;
  message: string;
  nextStatusChange: string | null;
  currentTime: string;
};

export default function LandingPage() {
  const [status, setStatus] = useState<ShopStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [doorHovered, setDoorHovered] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch('/api/shop/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch shop status:', error);
        // Default to open on error
        setStatus({
          isOpen: true,
          message: 'Shop is open',
          nextStatusChange: null,
          currentTime: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      {status.isOpen ? (
        // Entry Door (Shop Open)
        <Link href="/home" className="flex flex-col items-center">
          <div
            className="relative w-64 h-96 bg-gray-800 border-4 border-gray-700 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setDoorHovered(true)}
            onMouseLeave={() => setDoorHovered(false)}
          >
            {/* Door */}
            <div
              className={`absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-800 transition-all duration-500 ${
                doorHovered ? 'translate-x-[-100%]' : 'translate-x-0'
              }`}
            >
              {/* Door handle */}
              <div className="absolute top-1/2 right-4 w-3 h-8 bg-yellow-600 rounded-full transform -translate-y-1/2"></div>
            </div>

            {/* Light behind door */}
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-200 to-orange-400 flex items-center justify-center">
              <span className="text-gray-900 font-bold text-2xl">ENTER</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-3xl font-bold mb-2">DISTRACTION SHOP</h1>
            <p className="text-green-400 text-lg">{status.message}</p>
            <p className="text-gray-400 text-sm mt-2">Hover to unlock</p>
          </div>
        </Link>
      ) : (
        // Maintenance Door (Shop Closed)
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-96 bg-gray-800 border-4 border-gray-700 rounded-lg overflow-hidden">
            {/* Closed door */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-600 to-gray-700">
              {/* Padlock */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-12 h-8 bg-gray-400 rounded-t-full border-4 border-gray-400"></div>
                <div className="w-16 h-20 bg-gray-500 rounded"></div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-3xl font-bold mb-2">DISTRACTION SHOP</h1>
            <p className="text-red-400 text-lg">{status.message}</p>
            {status.nextStatusChange && (
              <p className="text-gray-400 text-sm mt-2">
                Check back soon!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
