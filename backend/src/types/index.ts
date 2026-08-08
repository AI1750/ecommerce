// ============================================
// 共享类型定义
// ============================================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'superadmin';
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  parent_id: string | null;
  image: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  slug: string;
  category_id: string | null;
  thumbnail: string | null;
  status: 'draft' | 'published' | 'archived';
  weight: number | null;
  is_giftcard: number;
  discountable: number;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductOption {
  id: string;
  product_id: string;
  title: string;
  values?: ProductOptionValue[];
  created_at: string;
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  inventory_quantity: number;
  weight: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  customer_id: string | null;
  email: string | null;
  status: 'open' | 'completed' | 'abandoned';
  currency: string;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string | null;
  email: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  shipping_address_id: string | null;
  billing_address_id: string | null;
  payment_status: PaymentStatus;
  payment_method: string | null;
  notes: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_title: string;
  variant_title: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 枚举类型
// ============================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

// ============================================
// API 响应类型
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

// ============================================
// JWT Payload
// ============================================

export interface JwtPayload {
  sub: string;
  role: 'admin' | 'customer';
  type: 'admin' | 'store';
}

// ============================================
// Express 扩展
// ============================================

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      services?: ServiceContainer;
    }
  }
}

export interface ServiceContainer {
  productService: any;
  cartService: any;
  orderService: any;
  customerService: any;
  paymentService: any;
}
