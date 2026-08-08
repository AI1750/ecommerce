import { Response, NextFunction } from 'express';
import { CustomerService } from './service';
import { AppError } from '../_shared/errors';
import { authenticateAdmin, authenticateCustomer } from '../../middleware/auth';

export class CustomerRouter {
  public router: any;

  constructor(private customerService: CustomerService) {
    const { Router } = require('express');
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    // Admin routes
    this.router.get('/admin/customers', authenticateAdmin, this.adminList.bind(this));
    this.router.get('/admin/customers/:id', authenticateAdmin, this.adminGet.bind(this));
    this.router.put('/admin/customers/:id', authenticateAdmin, this.adminUpdate.bind(this));

    // Store routes
    this.router.get('/store/customers/me', authenticateCustomer, this.getProfile.bind(this));
    this.router.put('/store/customers/me', authenticateCustomer, this.updateProfile.bind(this));
    this.router.put('/store/customers/me/password', authenticateCustomer, this.changePassword.bind(this));
    this.router.get('/store/customers/me/addresses', authenticateCustomer, this.listAddresses.bind(this));
    this.router.post('/store/customers/me/addresses', authenticateCustomer, this.createAddress.bind(this));
    this.router.put('/store/customers/me/addresses/:id', authenticateCustomer, this.updateAddress.bind(this));
    this.router.delete('/store/customers/me/addresses/:id', authenticateCustomer, this.deleteAddress.bind(this));
  }

  private async adminList(req: any, res: Response, next: NextFunction) {
    try {
      const { q, limit, offset } = req.query;
      const result = await this.customerService.listCustomers({
        q,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      });
      res.json({ success: true, data: result.customers, pagination: { total: result.total, limit: parseInt(req.query.limit || '20'), offset: parseInt(req.query.offset || '0') } });
    } catch (error) { next(error); }
  }

  private async adminGet(req: any, res: Response, next: NextFunction) {
    try {
      const customer = await this.customerService.getCustomerById(req.params.id);
      res.json({ success: true, data: customer });
    } catch (error) { next(error); }
  }

  private async adminUpdate(req: any, res: Response, next: NextFunction) {
    try {
      const customer = await this.customerService.updateCustomer(req.params.id, req.body);
      res.json({ success: true, data: customer });
    } catch (error) { next(error); }
  }

  private async getProfile(req: any, res: Response, next: NextFunction) {
    try {
      const customer = await this.customerService.getCustomerById(req.user.sub);
      res.json({ success: true, data: { customer } });
    } catch (error) { next(error); }
  }

  private async updateProfile(req: any, res: Response, next: NextFunction) {
    try {
      const customer = await this.customerService.updateCustomer(req.user.sub, req.body);
      res.json({ success: true, data: { customer } });
    } catch (error) { next(error); }
  }

  private async changePassword(req: any, res: Response, next: NextFunction) {
    try {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) throw AppError.badRequest('current_password and new_password are required');
      const result = await this.customerService.changePassword(req.user.sub, current_password, new_password);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  private async listAddresses(req: any, res: Response, next: NextFunction) {
    try {
      const addresses = await this.customerService.listAddresses(req.user.sub);
      res.json({ success: true, data: addresses });
    } catch (error) { next(error); }
  }

  private async createAddress(req: any, res: Response, next: NextFunction) {
    try {
      const address = await this.customerService.createAddress(req.user.sub, req.body);
      res.status(201).json({ success: true, data: address });
    } catch (error) { next(error); }
  }

  private async updateAddress(req: any, res: Response, next: NextFunction) {
    try {
      const address = await this.customerService.updateAddress(req.params.id, req.user.sub, req.body);
      res.json({ success: true, data: address });
    } catch (error) { next(error); }
  }

  private async deleteAddress(req: any, res: Response, next: NextFunction) {
    try {
      const result = await this.customerService.deleteAddress(req.params.id, req.user.sub);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}
