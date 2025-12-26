'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  createdBy: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.user.id);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: 'admin',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      alert('Admin user created successfully!');
      setEmail('');
      setPassword('');
      setIsCreateModalOpen(false);
      await fetchUsers();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      alert('User deleted successfully!');
      await fetchUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black">User Management</h1>
          <p className="text-gray-600 mt-1">Manage admin users and permissions</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black text-white px-6 py-3 rounded font-medium hover:bg-gray-800 transition-colors"
        >
          + Create Admin
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No users found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-black">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        user.role === 'superadmin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy HH:mm') : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.id === currentUserId ? (
                      <span className="text-gray-400">(You)</span>
                    ) : user.role === 'superadmin' ? (
                      <span className="text-gray-400">Protected</span>
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-black mb-4">Create Admin User</h2>

            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password (min 8 characters)
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Secure password"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    New user will be created with <strong>admin</strong> role. They can manage products but
                    cannot access superadmin features.
                  </p>
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800">{formError}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEmail('');
                    setPassword('');
                    setFormError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                  disabled={formLoading}
                >
                  {formLoading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
