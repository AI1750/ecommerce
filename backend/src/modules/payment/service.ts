import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import { AppError } from '../_shared/errors';

const SUPPORTED_METHODS = ['mock_wechat', 'mock_alipay', 'mock_card'];

export class PaymentService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  async processPayment(orderId: string, method: string): Promise<any> {
    if (!SUPPORTED_METHODS.includes(method)) {
      throw AppError.badRequest(`Unsupported payment method: ${method}. Supported: ${SUPPORTED_METHODS.join(', ')}`);
    }

    const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) throw AppError.notFound('Order');
    if (order.payment_status === 'paid') throw AppError.badRequest('Order already paid');

    // Find existing pending payment
    let payment = this.db.prepare("SELECT * FROM payments WHERE order_id = ? AND status = 'pending' LIMIT 1").get(orderId) as any;

    if (!payment) {
      const paymentId = uuidv4();
      this.db.prepare(`
        INSERT INTO payments (id, order_id, amount, currency, method, status)
        VALUES (?, ?, ?, 'CNY', ?, 'pending')
      `).run(paymentId, orderId, order.grand_total, method);
      payment = this.db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    }

    // Simulate payment processing (90% success rate)
    const success = Math.random() < 0.9;

    if (success) {
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      this.db.transaction(() => {
        this.db.prepare("UPDATE payments SET status = 'completed', method = ?, transaction_id = ?, updated_at = datetime('now') WHERE id = ?")
          .run(method, transactionId, payment.id);
        this.db.prepare("UPDATE orders SET payment_status = 'paid', payment_method = ?, updated_at = datetime('now') WHERE id = ?")
          .run(method, orderId);
        this.db.prepare("UPDATE orders SET status = 'confirmed', updated_at = datetime('now') WHERE id = ? AND status = 'pending'")
          .run(orderId);
        this.db.prepare(
          "INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'confirmed', 'Payment completed')"
        ).run(uuidv4(), orderId);
      })();

      return {
        ...payment,
        status: 'completed',
        transaction_id: transactionId,
      };
    } else {
      // Simulate failure
      this.db.prepare("UPDATE payments SET status = 'failed', updated_at = datetime('now') WHERE id = ?").run(payment.id);
      return {
        ...payment,
        status: 'failed',
      };
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    const payment = this.db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as any;
    if (!payment) throw AppError.notFound('Payment');
    return payment;
  }

  async refund(paymentId: string): Promise<any> {
    const payment = this.db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as any;
    if (!payment) throw AppError.notFound('Payment');
    if (payment.status !== 'completed') throw AppError.badRequest('Only completed payments can be refunded');

    this.db.transaction(() => {
      this.db.prepare("UPDATE payments SET status = 'refunded', updated_at = datetime('now') WHERE id = ?").run(paymentId);
      this.db.prepare("UPDATE orders SET payment_status = 'refunded', status = 'refunded', updated_at = datetime('now') WHERE id = ?")
        .run(payment.order_id);
      this.db.prepare(
        "INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'refunded', 'Payment refunded')"
      ).run(uuidv4(), payment.order_id);
    })();

    return this.db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  }
}
