import { Response, NextFunction } from 'express';
import { CartService } from './service';
import { AppError } from '../_shared/errors';
import { optionalAuth } from '../../middleware/auth';

export class CartRouter {
  public router: any;

  constructor(private cartService: CartService) {
    const { Router } = require('express');
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post('/store/carts', optionalAuth, this.createCart.bind(this));
    this.router.get('/store/carts/:id', optionalAuth, this.getCart.bind(this));
    this.router.post('/store/carts/:id/items', optionalAuth, this.addItem.bind(this));
    this.router.put('/store/carts/:id/items/:itemId', optionalAuth, this.updateItem.bind(this));
    this.router.delete('/store/carts/:id/items/:itemId', optionalAuth, this.removeItem.bind(this));
  }

  private async createCart(req: any, res: Response, next: NextFunction) {
    try {
      const cart = await this.cartService.create(req.user?.sub);
      res.status(201).json({ success: true, data: cart });
    } catch (error) { next(error); }
  }

  private async getCart(req: any, res: Response, next: NextFunction) {
    try {
      const cart = await this.cartService.retrieve(req.params.id);
      res.json({ success: true, data: cart });
    } catch (error) { next(error); }
  }

  private async addItem(req: any, res: Response, next: NextFunction) {
    try {
      const { variant_id, quantity } = req.body;
      if (!variant_id) throw AppError.badRequest('variant_id is required');
      const result = await this.cartService.addItem(req.params.id, variant_id, quantity || 1);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  private async updateItem(req: any, res: Response, next: NextFunction) {
    try {
      const { quantity } = req.body;
      if (quantity === undefined) throw AppError.badRequest('quantity is required');
      const result = await this.cartService.updateItem(req.params.id, req.params.itemId, quantity);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  private async removeItem(req: any, res: Response, next: NextFunction) {
    try {
      const result = await this.cartService.removeItem(req.params.id, req.params.itemId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}
