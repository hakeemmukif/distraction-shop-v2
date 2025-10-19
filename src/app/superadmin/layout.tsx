'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  role: string;
}

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');

      if (!response.ok) {
        router.push('/auth/login');
        return;
      }

      const data = await response.json();

      if (data.user.role !== 'superadmin') {
        router.push('/admin');
        return;
      }

      setUser(data.user);
    } catch (error) {
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-black">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black text-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold">DISTRACTION SUPERADMIN</h1>
            <nav className="hidden md:flex space-x-6">
              <Link href="/superadmin" className="hover:text-gray-300 transition-colors">
                Products
              </Link>
              <Link href="/superadmin/orders" className="hover:text-gray-300 transition-colors">
                Orders
              </Link>
              <Link href="/superadmin/users" className="hover:text-gray-300 transition-colors">
                Users
              </Link>
              <Link href="/superadmin/settings" className="hover:text-gray-300 transition-colors">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">{user?.email}</span>
            <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-medium">
              SUPERADMIN
            </span>
            <button
              onClick={handleLogout}
              className="bg-white text-black px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
