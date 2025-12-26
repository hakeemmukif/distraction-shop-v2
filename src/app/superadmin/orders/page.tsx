'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  image: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  status: string;
  total: number;
  currency: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchOrders();
  }, [offset, search, statusFilter, startDate, endDate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer Email', 'Customer Name', 'Total', 'Status', 'Items', 'Shipping Address'];

    const rows = orders.map((order) => [
      order.orderNumber,
      format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      order.customerEmail,
      order.customerName || '',
      `${order.currency} ${(Number(order.total) / 100).toFixed(2)}`,
      order.status,
      order.items.map((item) => `${item.name} (${item.size}) x${item.quantity}`).join('; '),
      `${order.shippingAddressLine1}, ${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Order Management</h1>
          <p className="text-gray-600 mt-1">{total} total orders</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={orders.length === 0}
          className="bg-black text-white px-6 py-3 rounded font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
        >
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
              placeholder="Order number, email, name..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No orders found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);

              return (
                <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Order Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button className="text-gray-400 hover:text-black">
                          {isExpanded ? '▼' : '▶'}
                        </button>
                        <div>
                          <div className="font-semibold text-black">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-bold text-black">
                            {order.currency} {(Number(order.total) / 100).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Details (Expanded) */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Items */}
                        <div>
                          <h3 className="font-semibold text-black mb-3">Order Items</h3>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center space-x-3 bg-white rounded p-2">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-black">{item.name}</div>
                                  <div className="text-xs text-gray-500">
                                    Size: {item.size} | Qty: {item.quantity}
                                  </div>
                                </div>
                                <div className="text-sm font-medium text-black">
                                  {order.currency} {(Number(item.total) / 100).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping Info */}
                        <div>
                          <h3 className="font-semibold text-black mb-3">Shipping Address</h3>
                          <div className="bg-white rounded p-3 text-sm">
                            <div className="font-medium text-black">{order.shippingName}</div>
                            <div className="text-gray-600 mt-1">{order.shippingPhone}</div>
                            <div className="text-gray-600 mt-2">
                              {order.shippingAddressLine1}
                              {order.shippingAddressLine2 && (
                                <>
                                  <br />
                                  {order.shippingAddressLine2}
                                </>
                              )}
                              <br />
                              {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                              <br />
                              {order.shippingCountry}
                            </div>
                          </div>

                          {order.customerName && (
                            <div className="mt-3">
                              <h3 className="font-semibold text-black mb-2">Customer Name</h3>
                              <div className="bg-white rounded p-3 text-sm text-gray-600">
                                {order.customerName}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {offset + 1} - {Math.min(offset + limit, total)} of {total} orders
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
