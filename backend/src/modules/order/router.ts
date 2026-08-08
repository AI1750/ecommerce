import { Response, NextFunction } from 'express';
import { OrderService } from './service';
import { AppError } from '../_shared/errors';
import { authenticateAdmin, authenticateCustomer } from '../../middleware/auth';

export class OrderRouter {
  public router: any;

  constructor(private orderService: OrderService) {
    const { Router } = require('express');
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    // Admin routes
    this.router.get('/admin/orders/stats', authenticateAdmin, this.getStats.bind(this));
    this.router.get('/admin/orders', authenticateAdmin, this.adminListOrders.bind(this));
    this.router.get('/admin/orders/:id', authenticateAdmin, this.adminGetOrder.bind(this));
    this.router.put('/admin/orders/:id/status', authenticateAdmin, this.updateStatus.bind(this));

    // Store routes
    this.router.post('/store/orders', authenticateCustomer, this.createOrder.bind(this));
    this.router.get('/store/orders', authenticateCustomer, this.customerListOrders.bind(this));
    this.router.get('/store/orders/:id', authenticateCustomer, this.customerGetOrder.bind(this));
    this.router.post('/store/orders/:id/cancel', authenticateCustomer, this.cancelOrder.bind(this));
  }

  private async getStats(_req: any, res: Response, next: NextFunction) {
    try {
      const stats = await this.orderService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  }

  private async adminListOrders(req: any, res: Response, next: NextFunction) {
    try {
      const { status, q, limit, offset } = req.query;
      const result = await this.orderService.list({
        status, q,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      });
      res.json({ success: true, data: result.orders, pagination: { total: result.total, limit: parseInt(req.query.limit || '20'), offset: parseInt(req.query.offset || '0') } });
    } catch (error) { next(error); }
  }

  private async adminGetOrder(req: any, res: Response, next: NextFunction) {
    try {
      const order = await this.orderService.retrieve(req.params.id);
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  }

  private async updateStatus(req: any, res: Response, next: NextFunction) {
    try {
      const { status, note } = req.body;
      if (!status) throw AppError.badRequest('status is required');
      const order = await this.orderService.updateStatus(req.params.id, status, note);
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  }

  private async createOrder(req: any, res: Response, next: NextFunction) {
    try {
      const { cart_id, shipping_address_id, billing_address_id, notes } = req.body;
      if (!cart_id) throw AppError.badRequest('cart_id is required');
      if (!shipping_address_id) throw AppError.badRequest('shipping_address_id is required');

      const customer = req.user;
      const customerRow = req.services.customerService?.getCustomerById(customer.sub);
      // We need email; fetch customer
      const { getDb } = require('../../database/connection');
      const db = getDb();
      const cust = db.prepare('SELECT email FROM customers WHERE id = ?').get(customer.sub) as any;

      const order = await this.orderService.createFromCart(
        customer.sub,
        cust?.email || 'unknown',
        cart_id,
        shipping_address_id,
        billing_address_id,
        notes
      );
      res.status(201).json({ success: true, data: order });
    } catch (error) { next(error); }
  }

  private async customerListOrders(req: any, res: Response, next: NextFunction) {
    try {
      const { status, limit, offset } = req.query;
      const result = await this.orderService.list({
        customer_id: req.user.sub, status,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      });
      res.json({ success: true, data: result.orders, pagination: { total: result.total, limit: parseInt(req.query.limit || '20'), offset: parseInt(req.query.offset || '0') } });
    } catch (error) { next(error); }
  }

  private async customerGetOrder(req: any, res: Response, next: NextFunction) {
    try {
      const order = await this.orderService.retrieve(req.params.id);
      if (order.customer_id !== req.user.sub) {
        throw AppError.forbidden('Access denied');
      }
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  }

  private async cancelOrder(req: any, res: Response, next: NextFunction) {
    try {
      const order = await this.orderService.retrieve(req.params.id);
      if (order.customer_id !== req.user.sub) {
        throw AppError.forbidden('Access denied');
      }
      const result = await this.orderService.cancelOrder(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}
