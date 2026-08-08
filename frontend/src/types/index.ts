// ============================================
// Frontend Types (mirrors backend types)
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

export interface Product {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  slug: string;
  category_id: string | null;
  category_name?: string;
  thumbnail: string | null;
  status: 'draft' | 'published' | 'archived';
  weight: number | null;
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  options?: ProductOption[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface ProductOption {
  id: string;
  product_id: string;
  title: string;
  values?: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  is_active: number;
  option_values?: { option_id: string; value: string }[];
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  parent_id: string | null;
  image: string | null;
  is_active: number;
  children?: Category[];
}

export interface Cart {
  id: string;
  customer_id: string | null;
  status: 'open' | 'completed' | 'abandoned';
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  variant?: {
    id: string;
    title: string;
    price: number;
    product?: {
      id: string;
      title: string;
      thumbnail: string | null;
      slug: string;
    };
  };
}

export interface Order {
  id: string;
  customer_id: string | null;
  email: string;
  status: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  items?: OrderItem[];
  shipping_address?: Address;
  status_history?: { id: string; status: string; note?: string; created_at: string }[];
  payment?: Payment;
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
}

export interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: number;
  created_at: string;
}

export interface CustomerStats {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Order[];
  ordersByStatus: Record<string, number>;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transaction_id: string | null;
}
