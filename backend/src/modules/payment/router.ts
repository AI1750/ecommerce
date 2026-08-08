import { Response, NextFunction } from 'express';
import { PaymentService } from './service';
import { authenticateAdmin, authenticateCustomer } from '../../middleware/auth';

export class PaymentRouter {
  public router: any;

  constructor(private paymentService: PaymentService) {
    const { Router } = require('express');
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    // Store routes
    this.router.post('/store/payments/process', authenticateCustomer, this.process.bind(this));
    this.router.get('/store/payments/:id', authenticateCustomer, this.getPayment.bind(this));

    // Admin routes
    this.router.post('/admin/payments/:id/refund', authenticateAdmin, this.refund.bind(this));
  }

  private async process(req: any, res: Response, next: NextFunction) {
    try {
      const { order_id, method } = req.body;
      if (!order_id || !method) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'order_id and method are required' } });
        return;
      }
      const result = await this.paymentService.processPayment(order_id, method);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  private async getPayment(req: any, res: Response, next: NextFunction) {
    try {
      const payment = await this.paymentService.getPayment(req.params.id);
      res.json({ success: true, data: payment });
    } catch (error) { next(error); }
  }

  private async refund(req: any, res: Response, next: NextFunction) {
    try {
      const result = await this.paymentService.refund(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}
