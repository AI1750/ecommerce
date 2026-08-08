import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import { AppError } from '../_shared/errors';
import { CartService } from '../cart/service';
import { ProductService } from '../product/service';
import { ORDER_STATUS_TRANSITIONS, OrderStatus } from '../../types';

export interface OrderFilter {
  customer_id?: string;
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export class OrderService {
  private db: Database.Database;
  private cartService: CartService;
  private productService: ProductService;

  constructor(db: Database.Database, cartService: CartService, productService: ProductService) {
    this.db = db;
    this.cartService = cartService;
    this.productService = productService;
  }

  async createFromCart(
    customerId: string,
    email: string,
    cartId: string,
    shippingAddressId: string,
    billingAddressId?: string,
    notes?: string
  ): Promise<any> {
    const cart = await this.cartService.retrieve(cartId);
    if (!cart.items || cart.items.length === 0) {
      throw AppError.badRequest('Cart is empty');
    }

    // Validate addresses
    const shipAddr = this.db.prepare('SELECT * FROM addresses WHERE id = ? AND customer_id = ?').get(shippingAddressId, customerId);
    if (!shipAddr) throw AppError.notFound('Shipping address');

    let billAddr = null;
    if (billingAddressId) {
      billAddr = this.db.prepare('SELECT * FROM addresses WHERE id = ? AND customer_id = ?').get(billingAddressId, customerId);
      if (!billAddr) throw AppError.notFound('Billing address');
    }

    const orderId = uuidv4();
    const subtotal = cart.subtotal || 0;
    const shippingTotal = 1000; // ¥10.00 in cents
    const taxTotal = 0;
    const grandTotal = subtotal + shippingTotal + taxTotal;

    // Create order in transaction
    this.db.transaction(() => {
      // Create order
      this.db.prepare(`
        INSERT INTO orders (id, customer_id, email, status, subtotal, shipping_total, tax_total, discount_total, grand_total, shipping_address_id, billing_address_id, notes)
        VALUES (?, ?, ?, 'pending', ?, ?, ?, 0, ?, ?, ?, ?)
      `).run(orderId, customerId, email, subtotal, shippingTotal, taxTotal, grandTotal,
        shippingAddressId, billingAddressId || shippingAddressId, notes || null);

      // Create order items (snapshot current data)
      const insertItem = this.db.prepare(`
        INSERT INTO order_items (id, order_id, variant_id, product_title, variant_title, sku, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of cart.items) {
        const variant = item.variant;
        const product = variant?.product;
        insertItem.run(
          uuidv4(), orderId, item.variant_id,
          product?.title || 'Unknown', variant?.title || 'Unknown',
          variant?.sku || null, item.quantity, item.unit_price,
          item.unit_price * item.quantity
        );

        // Deduct inventory
        this.db.prepare(
          'UPDATE product_variants SET inventory_quantity = inventory_quantity - ? WHERE id = ? AND inventory_quantity >= ?'
        ).run(item.quantity, item.variant_id, item.quantity);
      }

      // Create payment record
      this.db.prepare(`
        INSERT INTO payments (id, order_id, amount, currency, method, status)
        VALUES (?, ?, ?, 'CNY', 'pending', 'pending')
      `).run(uuidv4(), orderId, grandTotal);

      // Status history
      this.db.prepare(`
        INSERT INTO order_status_history (id, order_id, status, note)
        VALUES (?, ?, 'pending', 'Order created')
      `).run(uuidv4(), orderId);

      // Complete cart
      this.cartService.completeCart(cartId);
    })();

    return this.retrieve(orderId);
  }

  async list(filter: OrderFilter = {}): Promise<{ orders: any[]; total: number }> {
    let query = 'SELECT * FROM orders WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (filter.customer_id) {
      query += ' AND customer_id = ?';
      countQuery += ' AND customer_id = ?';
      params.push(filter.customer_id);
      countParams.push(filter.customer_id);
    }

    if (filter.status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(filter.status);
      countParams.push(filter.status);
    }

    if (filter.q) {
      query += ' AND (id LIKE ? OR email LIKE ?)';
      countQuery += ' AND (id LIKE ? OR email LIKE ?)';
      const q = `%${filter.q}%`;
      params.push(q, q);
      countParams.push(q, q);
    }

    query += ' ORDER BY created_at DESC';

    const limit = filter.limit || 20;
    const offset = filter.offset || 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { total } = this.db.prepare(countQuery).get(...countParams) as any;
    const orders = this.db.prepare(query).all(...params) as any[];

    // Enrich with item count
    for (const order of orders) {
      const count = this.db.prepare('SELECT COUNT(*) as c FROM order_items WHERE order_id = ?').get(order.id) as any;
      order.item_count = count.c;
    }

    return { orders, total };
  }

  async retrieve(orderId: string): Promise<any> {
    const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) throw AppError.notFound('Order');

    const items = this.db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as any[];
    const statusHistory = this.db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at').all(orderId) as any[];
    const payment = this.db.prepare('SELECT * FROM payments WHERE order_id = ? LIMIT 1').get(orderId) as any;

    if (order.shipping_address_id) {
      order.shipping_address = this.db.prepare('SELECT * FROM addresses WHERE id = ?').get(order.shipping_address_id);
    }

    return {
      ...order,
      items,
      status_history: statusHistory,
      payment,
    };
  }

  async updateStatus(orderId: string, status: OrderStatus, note?: string): Promise<any> {
    const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) throw AppError.notFound('Order');

    const currentStatus = order.status as OrderStatus;
    const allowed = ORDER_STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(status)) {
      throw AppError.badRequest(`Cannot transition from '${currentStatus}' to '${status}'`);
    }

    this.db.transaction(() => {
      this.db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, orderId);
      this.db.prepare(
        'INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, ?, ?)'
      ).run(uuidv4(), orderId, status, note || null);
    })();

    return this.retrieve(orderId);
  }

  async cancelOrder(orderId: string): Promise<any> {
    const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) throw AppError.notFound('Order');

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw AppError.badRequest('Order cannot be cancelled in current status');
    }

    this.db.transaction(() => {
      // Restore inventory
      const items = this.db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as any[];
      for (const item of items) {
        this.db.prepare('UPDATE product_variants SET inventory_quantity = inventory_quantity + ? WHERE id = ?')
          .run(item.quantity, item.variant_id);
      }

      this.db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(orderId);
      this.db.prepare(
        'INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, \'cancelled\', \'Order cancelled by customer\')'
      ).run(uuidv4(), orderId);
    })();

    return this.retrieve(orderId);
  }

  async getStats(): Promise<any> {
    const totalOrders = (this.db.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c;
    const totalRevenue = (this.db.prepare("SELECT COALESCE(SUM(grand_total), 0) as r FROM orders WHERE status NOT IN ('cancelled', 'refunded')").get() as any).r;
    const totalProducts = (this.db.prepare('SELECT COUNT(*) as c FROM products WHERE status = ?').get('published') as any).c;
    const totalCustomers = (this.db.prepare('SELECT COUNT(*) as c FROM customers').get() as any).c;
    const recentOrders = this.db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').all() as any[];
    const ordersByStatus = {} as Record<string, number>;

    const statuses = this.db.prepare('SELECT status, COUNT(*) as c FROM orders GROUP BY status').all() as any[];
    for (const s of statuses) {
      ordersByStatus[s.status] = s.c;
    }

    return { totalOrders, totalRevenue, totalProducts, totalCustomers, recentOrders, ordersByStatus };
  }
}
