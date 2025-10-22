/**
 * Order Management Types
 * Type-safe interfaces for Stripe orders and order management
 */

export interface OrderLineItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  amount: number; // cents
  currency: string;
  images?: string[];
}

export interface OrderShippingAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
}

export interface OrderCustomer {
  email: string;
  name: string;
  phone?: string | null;
}

export interface OrderShipping {
  name: string;
  address: OrderShippingAddress;
}

export type OrderStatus = 'complete' | 'expired' | 'open';
export type PaymentStatus = 'paid' | 'unpaid' | 'no_payment_required';

export interface Order {
  id: string;
  customer: OrderCustomer;
  shipping?: OrderShipping | null;
  line_items: OrderLineItem[];
  amount_total: number; // cents
  amount_subtotal: number; // cents
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created: number; // Unix timestamp
  metadata?: Record<string, string>;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  hasMore: boolean;
}

export interface OrderFilters {
  limit?: number;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string; // Search by customer email or order ID
}
