import { Response, NextFunction } from 'express';
import { AuthService } from './service';
import { AppError } from '../_shared/errors';
import { authenticateAdmin, authenticateCustomer } from '../../middleware/auth';

export class AuthRouter {
  public router: any;

  constructor(private authService: AuthService) {
    const { Router } = require('express');
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    // ============================================
    // Admin Routes
    // ============================================

    this.router.post('/admin/auth/login', this.adminLogin.bind(this));
    this.router.get('/admin/auth/me', authenticateAdmin, this.getAdminProfile.bind(this));

    // ============================================
    // Store Routes
    // ============================================

    this.router.post('/store/auth/register', this.customerRegister.bind(this));
    this.router.post('/store/auth/login', this.customerLogin.bind(this));
    this.router.get('/store/auth/me', authenticateCustomer, this.getCustomerProfile.bind(this));
  }

  private async adminLogin(req: any, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw AppError.badRequest('Email and password are required');
      }
      const result = await this.authService.adminLogin(email, password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  private async getAdminProfile(req: any, res: Response, next: NextFunction) {
    try {
      const user = await this.authService.getAdminProfile(req.user.sub);
      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }

  private async customerRegister(req: any, res: Response, next: NextFunction) {
    try {
      const { email, password, first_name, last_name, phone } = req.body;
      if (!email || !password || !first_name || !last_name) {
        throw AppError.badRequest('Email, password, first_name, and last_name are required');
      }
      const result = await this.authService.customerRegister({ email, password, first_name, last_name, phone });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  private async customerLogin(req: any, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw AppError.badRequest('Email and password are required');
      }
      const result = await this.authService.customerLogin(email, password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  private async getCustomerProfile(req: any, res: Response, next: NextFunction) {
    try {
      const customer = await this.authService.getCustomerProfile(req.user.sub);
      res.json({ success: true, data: { customer } });
    } catch (error) {
      next(error);
    }
  }
}
