import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { config } from '../../config';
import { AppError } from '../_shared/errors';

export class AuthService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // ============================================
  // Admin Methods
  // ============================================

  async adminLogin(email: string, password: string) {
    const user = this.db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email) as any;
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const token = this.generateToken({ sub: user.id, role: 'admin', type: 'admin' }, config.jwtAdminExpiresIn);
    const { password_hash, ...safeUser } = user;

    return { token, user: safeUser };
  }

  async getAdminProfile(userId: string) {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(userId) as any;
    if (!user) {
      throw AppError.notFound('Admin user');
    }
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  // ============================================
  // Customer Methods
  // ============================================

  async customerRegister(data: { email: string; password: string; first_name: string; last_name: string; phone?: string }) {
    // Check existing
    const existing = this.db.prepare('SELECT id FROM customers WHERE email = ?').get(data.email);
    if (existing) {
      throw AppError.conflict('Email already registered');
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(data.password, 10);

    this.db.prepare(`
      INSERT INTO customers (id, email, password_hash, first_name, last_name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.email, password_hash, data.first_name, data.last_name, data.phone || null);

    const customer = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as any;
    const token = this.generateToken({ sub: customer.id, role: 'customer', type: 'store' }, config.jwtCustomerExpiresIn);
    const { password_hash: _, ...safeCustomer } = customer;

    return { token, customer: safeCustomer };
  }

  async customerLogin(email: string, password: string) {
    const customer = this.db.prepare('SELECT * FROM customers WHERE email = ? AND is_active = 1').get(email) as any;
    if (!customer) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const token = this.generateToken({ sub: customer.id, role: 'customer', type: 'store' }, config.jwtCustomerExpiresIn);
    const { password_hash, ...safeCustomer } = customer;

    return { token, customer: safeCustomer };
  }

  async getCustomerProfile(customerId: string) {
    const customer = this.db.prepare('SELECT * FROM customers WHERE id = ? AND is_active = 1').get(customerId) as any;
    if (!customer) {
      throw AppError.notFound('Customer');
    }
    const { password_hash, ...safeCustomer } = customer;
    return safeCustomer;
  }

  // ============================================
  // Token Methods
  // ============================================

  generateToken(payload: { sub: string; role: string; type: string }, expiresIn: string): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn } as jwt.SignOptions);
  }

  verifyToken(token: string): any {
    return jwt.verify(token, config.jwtSecret);
  }
}
