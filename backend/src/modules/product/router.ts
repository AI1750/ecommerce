import { Response, NextFunction } from 'express';
import { ProductService } from './service';
import { AppError } from '../_shared/errors';
import { authenticateAdmin } from '../../middleware/auth';

export class ProductRouter {
  public router: any;

  constructor(private productService: ProductService) {
    const { Router } = require('express');
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    // ============================================
    // Admin Product Routes
    // ============================================
    this.router.get('/admin/products', authenticateAdmin, this.adminListProducts.bind(this));
    this.router.get('/admin/products/:id', authenticateAdmin, this.adminGetProduct.bind(this));
    this.router.post('/admin/products', authenticateAdmin, this.createProduct.bind(this));
    this.router.put('/admin/products/:id', authenticateAdmin, this.updateProduct.bind(this));
    this.router.delete('/admin/products/:id', authenticateAdmin, this.deleteProduct.bind(this));

    // Variants
    this.router.post('/admin/products/:id/variants', authenticateAdmin, this.createVariant.bind(this));
    this.router.put('/admin/products/:id/variants/:vid', authenticateAdmin, this.updateVariant.bind(this));
    this.router.delete('/admin/products/:id/variants/:vid', authenticateAdmin, this.deleteVariant.bind(this));

    // Options
    this.router.post('/admin/products/:id/options', authenticateAdmin, this.createOption.bind(this));
    this.router.delete('/admin/products/:id/options/:optId', authenticateAdmin, this.deleteOption.bind(this));

    // Images
    this.router.post('/admin/products/:id/images', authenticateAdmin, this.addImage.bind(this));
    this.router.delete('/admin/products/:id/images/:imgId', authenticateAdmin, this.deleteImage.bind(this));

    // Categories
    this.router.get('/admin/categories', authenticateAdmin, this.listCategories.bind(this));
    this.router.post('/admin/categories', authenticateAdmin, this.createCategory.bind(this));
    this.router.put('/admin/categories/:id', authenticateAdmin, this.updateCategory.bind(this));
    this.router.delete('/admin/categories/:id', authenticateAdmin, this.deleteCategory.bind(this));

    // ============================================
    // Store Product Routes
    // ============================================
    this.router.get('/store/products', this.storeListProducts.bind(this));
    this.router.get('/store/products/:id', this.storeGetProduct.bind(this));
    this.router.get('/store/categories', this.listCategories.bind(this));
    this.router.get('/store/categories/:slug', this.getCategoryBySlug.bind(this));
  }

  // Admin Handlers
  private async adminListProducts(req: any, res: Response, next: NextFunction) {
    try {
      const { q, category_id, status, sort_by, limit, offset } = req.query;
      const result = await this.productService.list({
        q, category_id, status, sort_by,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      });
      res.json({ success: true, data: result.products, pagination: { total: result.total, limit: parseInt(req.query.limit || '20'), offset: parseInt(req.query.offset || '0') } });
    } catch (error) { next(error); }
  }

  private async adminGetProduct(req: any, res: Response, next: NextFunction) {
    try {
      const product = await this.productService.retrieve(req.params.id);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  private async createProduct(req: any, res: Response, next: NextFunction) {
    try {
      const product = await this.productService.create(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  private async updateProduct(req: any, res: Response, next: NextFunction) {
    try {
      const product = await this.productService.update(req.params.id, req.body);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  private async deleteProduct(req: any, res: Response, next: NextFunction) {
    try {
      const result = await this.productService.delete(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  private async createVariant(req: any, res: Response, next: NextFunction) {
    try {
      const variant = await this.productService.createVariant(req.params.id, req.body);
      res.status(201).json({ success: true, data: variant });
    } catch (error) { next(error); }
  }

  private async updateVariant(req: any, res: Response, next: NextFunction) {
    try {
      const variant = await this.productService.updateVariant(req.params.vid, req.body);
      res.json({ success: true, data: variant });
    } catch (error) { next(error); }
  }

  private async deleteVariant(req: any, res: Response, next: NextFunction) {
    try {
      const result = await this.productService.deleteVariant(req.params.vid);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  private async createOption(req: any, res: Response, next: NextFunction) {
    try {
      const option = await this.productService.createOption(req.params.id, req.body);
      res.status(201).json({ success: true, data: option });
    } catch (error) { next(error); }
  }

  private async deleteOption(req: any, res: Response, next: NextFunction) {
    try {
      const result = await this.productService.deleteOption(req.params.optId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  private async addImage(req: any, res: Response, next: NextFunction) {
    try {
      const image = await this.productService.addImage(req.params.id, req.body);
      res.status(201).json({ success: true, data: image });
    } catch (error) { next(error); }
  }

  private async deleteImage(req: any, res: Response, next: NextFunction) {
    try {
      const result = await this.productService.deleteImage(req.params.imgId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  private async listCategories(_req: any, res: Response, next: NextFunction) {
    try {
      const categories = await this.productService.listCategories();
      res.json({ success: true, data: categories });
    } catch (error) { next(error); }
  }

  private async createCategory(req: any, res: Response, next: NextFunction) {
    try {
      const category = await this.productService.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) { next(error); }
  }

  private async updateCategory(req: any, res: Response, next: NextFunction) {
    try {
      const category = await this.productService.updateCategory(req.params.id, req.body);
      res.json({ success: true, data: category });
    } catch (error) { next(error); }
  }

  private async deleteCategory(req: any, res: Response, next: NextFunction) {
    try {
      const result = await this.productService.deleteCategory(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  // Store Handlers
  private async storeListProducts(req: any, res: Response, next: NextFunction) {
    try {
      const { q, category_id, sort_by, limit, offset } = req.query;
      const result = await this.productService.list({
        q, category_id, status: 'published', sort_by,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      });
      res.json({ success: true, data: result.products, pagination: { total: result.total, limit: parseInt(req.query.limit || '20'), offset: parseInt(req.query.offset || '0') } });
    } catch (error) { next(error); }
  }

  private async storeGetProduct(req: any, res: Response, next: NextFunction) {
    try {
      const product = await this.productService.retrieve(req.params.id);
      if (product.status !== 'published') {
        throw AppError.notFound('Product');
      }
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  private async getCategoryBySlug(req: any, res: Response, next: NextFunction) {
    try {
      const category = await this.productService.getCategoryBySlug(req.params.slug);
      res.json({ success: true, data: category });
    } catch (error) { next(error); }
  }
}
