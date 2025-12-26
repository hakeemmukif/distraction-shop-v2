'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [doorHovered, setDoorHovered] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
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
          <p className="text-green-400 text-lg">Shop is open</p>
          <p className="text-gray-400 text-sm mt-2">Hover to unlock</p>
        </div>
      </Link>
    </div>
  );
}
