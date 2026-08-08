import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { AppError } from '../_shared/errors';

export class CustomerService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // Admin
  async listCustomers(filter: { q?: string; limit?: number; offset?: number }) {
    let query = 'SELECT * FROM customers WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (filter.q) {
      const q = `%${filter.q}%`;
      query += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      countQuery += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      params.push(q, q, q);
      countParams.push(q, q, q);
    }

    query += ' ORDER BY created_at DESC';

    const limit = filter.limit || 20;
    const offset = filter.offset || 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { total } = this.db.prepare(countQuery).get(...countParams) as any;
    const customers = this.db.prepare(query).all(...params) as any[];

    // Enrich with stats
    for (const c of customers) {
      const orderStats = this.db.prepare(
        "SELECT COUNT(*) as total_orders, COALESCE(SUM(grand_total), 0) as total_spent FROM orders WHERE customer_id = ? AND status NOT IN ('cancelled', 'refunded')"
      ).get(c.id) as any;
      c.total_orders = orderStats.total_orders;
      c.total_spent = orderStats.total_spent;
      const { password_hash, ...safe } = c;
      Object.assign(c, safe);
    }

    return { customers, total };
  }

  async getCustomerById(id: string) {
    const c = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as any;
    if (!c) throw AppError.notFound('Customer');
    const { password_hash, ...safe } = c;
    return safe;
  }

  async updateCustomer(id: string, data: any) {
    const c = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as any;
    if (!c) throw AppError.notFound('Customer');

    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (['first_name', 'last_name', 'phone', 'is_active'].includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(id);
      this.db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getCustomerById(id);
  }

  // Addresses
  async listAddresses(customerId: string) {
    return this.db.prepare('SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC').all(customerId);
  }

  async createAddress(customerId: string, data: { first_name: string; last_name: string; address_1: string; address_2?: string; city: string; province: string; postal_code: string; phone?: string; is_default?: boolean }) {
    const id = uuidv4();

    // Unset default if new is default
    if (data.is_default) {
      this.db.prepare('UPDATE addresses SET is_default = 0 WHERE customer_id = ?').run(customerId);
    }

    this.db.prepare(`
      INSERT INTO addresses (id, customer_id, first_name, last_name, address_1, address_2, city, province, postal_code, phone, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, customerId, data.first_name, data.last_name, data.address_1,
      data.address_2 || null, data.city, data.province, data.postal_code,
      data.phone || null, data.is_default ? 1 : 0);

    return this.db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
  }

  async updateAddress(addressId: string, customerId: string, data: any) {
    const addr = this.db.prepare('SELECT * FROM addresses WHERE id = ? AND customer_id = ?').get(addressId, customerId);
    if (!addr) throw AppError.notFound('Address');

    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (['first_name', 'last_name', 'address_1', 'address_2', 'city', 'province', 'postal_code', 'country', 'phone', 'is_default'].includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (data.is_default) {
      this.db.prepare('UPDATE addresses SET is_default = 0 WHERE customer_id = ? AND id != ?').run(customerId, addressId);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(addressId);
      this.db.prepare(`UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.db.prepare('SELECT * FROM addresses WHERE id = ?').get(addressId);
  }

  async deleteAddress(addressId: string, customerId: string) {
    const addr = this.db.prepare('SELECT * FROM addresses WHERE id = ? AND customer_id = ?').get(addressId, customerId);
    if (!addr) throw AppError.notFound('Address');

    // Don't delete default if it's the only one
    const count = (this.db.prepare('SELECT COUNT(*) as c FROM addresses WHERE customer_id = ?').get(customerId) as any).c;
    if (count <= 1 && (addr as any).is_default) {
      throw AppError.badRequest('Cannot delete the only default address');
    }

    this.db.prepare('DELETE FROM addresses WHERE id = ?').run(addressId);
    return { deleted: true };
  }

  async changePassword(customerId: string, currentPassword: string, newPassword: string) {
    const c = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as any;
    if (!c) throw AppError.notFound('Customer');

    const valid = await bcrypt.compare(currentPassword, c.password_hash);
    if (!valid) throw AppError.badRequest('Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, 10);
    this.db.prepare("UPDATE customers SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, customerId);
    return { success: true };
  }
}
