import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import { AppError } from '../_shared/errors';

export interface ProductFilter {
  q?: string;
  category_id?: string;
  status?: string;
  sort_by?: string;
  limit?: number;
  offset?: number;
}

export class ProductService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // ============================================
  // Product CRUD
  // ============================================

  async list(filter: ProductFilter = {}) {
    let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (filter.q) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      countQuery += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      const q = `%${filter.q}%`;
      params.push(q, q);
      countParams.push(q, q);
    }

    if (filter.category_id) {
      query += ' AND p.category_id = ?';
      countQuery += ' AND p.category_id = ?';
      params.push(filter.category_id);
      countParams.push(filter.category_id);
    }

    if (filter.status) {
      query += ' AND p.status = ?';
      countQuery += ' AND p.status = ?';
      params.push(filter.status);
      countParams.push(filter.status);
    } else {
      // Default: show all non-archived for admin, published for store
      query += ' AND p.status != ?';
      countQuery += ' AND p.status != ?';
      params.push('archived');
      countParams.push('archived');
    }

    // Sort
    switch (filter.sort_by) {
      case 'price_asc':
        query += ' ORDER BY (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id) ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id) DESC';
        break;
      case 'title':
        query += ' ORDER BY p.title ASC';
        break;
      default:
        query += ' ORDER BY p.created_at DESC';
    }

    const limit = filter.limit || 20;
    const offset = filter.offset || 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { total } = this.db.prepare(countQuery).get(...countParams) as any;
    const products = this.db.prepare(query).all(...params) as any[];

    // Attach thumbnails
    for (const p of products) {
      const img = this.db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order LIMIT 1').get(p.id) as any;
      p.thumbnail = img?.url || null;
    }

    return { products, total };
  }

  async retrieve(id: string) {
    const product = this.db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id) as any;

    if (!product) {
      throw AppError.notFound('Product');
    }

    const images = this.db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(id) as any[];
    const options = this.db.prepare('SELECT * FROM product_options WHERE product_id = ?').all(id) as any[];
    for (const opt of options) {
      opt.values = this.db.prepare('SELECT * FROM product_option_values WHERE option_id = ? ORDER BY sort_order').all(opt.id) as any[];
    }
    const variants = this.db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(id) as any[];
    for (const v of variants) {
      const vovs = this.db.prepare(`
        SELECT ov.id, ov.value, o.id as option_id, o.title as option_title
        FROM variant_option_values vov
        JOIN product_option_values ov ON vov.option_value_id = ov.id
        JOIN product_options o ON ov.option_id = o.id
        WHERE vov.variant_id = ?
      `).all(v.id) as any[];
      v.option_values = vovs;
    }

    product.images = images;
    product.options = options;
    product.variants = variants;
    product.thumbnail = images.length > 0 ? images[0].url : null;

    return product;
  }

  async create(data: {
    title: string;
    subtitle?: string;
    description?: string;
    category_id?: string;
    status?: string;
    weight?: number;
    metadata?: string;
  }) {
    const id = uuidv4();
    const slug = this.generateSlug(data.title);

    this.db.prepare(`
      INSERT INTO products (id, title, subtitle, description, slug, category_id, status, weight, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.title, data.subtitle || null, data.description || null, slug,
      data.category_id || null, data.status || 'draft', data.weight || null, data.metadata || null);

    return this.retrieve(id);
  }

  async update(id: string, data: any) {
    const product = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) throw AppError.notFound('Product');

    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (['title', 'subtitle', 'description', 'category_id', 'status', 'weight', 'metadata'].includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(id);
      this.db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.retrieve(id);
  }

  async delete(id: string) {
    const product = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) throw AppError.notFound('Product');
    this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return { deleted: true };
  }

  // ============================================
  // Variant Methods
  // ============================================

  async createVariant(productId: string, data: {
    title: string;
    sku?: string;
    price: number;
    compare_at_price?: number;
    cost_price?: number;
    inventory_quantity?: number;
    option_value_ids?: string[];
  }) {
    const product = this.db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) throw AppError.notFound('Product');

    const id = uuidv4();
    this.db.prepare(`
      INSERT INTO product_variants (id, product_id, title, sku, price, compare_at_price, cost_price, inventory_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, productId, data.title, data.sku || null, data.price,
      data.compare_at_price || null, data.cost_price || null, data.inventory_quantity || 0);

    // Link option values
    if (data.option_value_ids?.length) {
      const insert = this.db.prepare(
        'INSERT INTO variant_option_values (id, variant_id, option_value_id) VALUES (?, ?, ?)'
      );
      for (const ovId of data.option_value_ids) {
        insert.run(uuidv4(), id, ovId);
      }
    }

    return this.db.prepare('SELECT * FROM product_variants WHERE id = ?').get(id);
  }

  async updateVariant(variantId: string, data: any) {
    const variant = this.db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variantId);
    if (!variant) throw AppError.notFound('Variant');

    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (['title', 'sku', 'barcode', 'price', 'compare_at_price', 'cost_price', 'inventory_quantity', 'weight', 'is_active'].includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(variantId);
      this.db.prepare(`UPDATE product_variants SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variantId);
  }

  async deleteVariant(variantId: string) {
    const variant = this.db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variantId);
    if (!variant) throw AppError.notFound('Variant');
    this.db.prepare('DELETE FROM product_variants WHERE id = ?').run(variantId);
    return { deleted: true };
  }

  // ============================================
  // Option Methods
  // ============================================

  async createOption(productId: string, data: { title: string; values: string[] }) {
    const product = this.db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) throw AppError.notFound('Product');

    const optionId = uuidv4();
    this.db.prepare('INSERT INTO product_options (id, product_id, title) VALUES (?, ?, ?)').run(optionId, productId, data.title);

    if (data.values?.length) {
      const insertValue = this.db.prepare(
        'INSERT INTO product_option_values (id, option_id, value, sort_order) VALUES (?, ?, ?, ?)'
      );
      data.values.forEach((v, i) => {
        insertValue.run(uuidv4(), optionId, v, i);
      });
    }

    const option = this.db.prepare('SELECT * FROM product_options WHERE id = ?').get(optionId) as any;
    option.values = this.db.prepare('SELECT * FROM product_option_values WHERE option_id = ? ORDER BY sort_order').all(optionId) as any[];
    return option;
  }

  async deleteOption(optionId: string) {
    const option = this.db.prepare('SELECT * FROM product_options WHERE id = ?').get(optionId);
    if (!option) throw AppError.notFound('Option');
    this.db.prepare('DELETE FROM product_options WHERE id = ?').run(optionId);
    return { deleted: true };
  }

  // ============================================
  // Image Methods
  // ============================================

  async addImage(productId: string, data: { url: string; alt_text?: string }) {
    const product = this.db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) throw AppError.notFound('Product');

    const maxOrder = this.db.prepare('SELECT MAX(sort_order) as m FROM product_images WHERE product_id = ?').get(productId) as any;
    const id = uuidv4();
    this.db.prepare(
      'INSERT INTO product_images (id, product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).run(id, productId, data.url, data.alt_text || null, (maxOrder?.m || 0) + 1);

    return this.db.prepare('SELECT * FROM product_images WHERE id = ?').get(id);
  }

  async deleteImage(imageId: string) {
    const img = this.db.prepare('SELECT * FROM product_images WHERE id = ?').get(imageId);
    if (!img) throw AppError.notFound('Image');
    this.db.prepare('DELETE FROM product_images WHERE id = ?').run(imageId);
    return { deleted: true };
  }

  // ============================================
  // Category Methods
  // ============================================

  async listCategories() {
    const categories = this.db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order').all() as any[];
    return this.buildCategoryTree(categories);
  }

  async createCategory(data: { name: string; description?: string; parent_id?: string; image?: string }) {
    const id = uuidv4();
    const slug = this.generateSlug(data.name);

    this.db.prepare(`
      INSERT INTO categories (id, name, description, slug, parent_id, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.description || null, slug, data.parent_id || null, data.image || null);

    return this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  async updateCategory(id: string, data: any) {
    const cat = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!cat) throw AppError.notFound('Category');

    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (['name', 'description', 'parent_id', 'image', 'is_active', 'sort_order'].includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(id);
      this.db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  async deleteCategory(id: string) {
    const cat = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!cat) throw AppError.notFound('Category');

    // Reassign child categories
    this.db.prepare('UPDATE categories SET parent_id = ? WHERE parent_id = ?').run(cat.parent_id, id);

    // Unlink products
    this.db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(id);

    this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return { deleted: true };
  }

  async getCategoryBySlug(slug: string) {
    const cat = this.db.prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1').get(slug) as any;
    if (!cat) throw AppError.notFound('Category');
    return cat;
  }

  // ============================================
  // Inventory
  // ============================================

  async getInventory(variantId: string): Promise<number> {
    const v = this.db.prepare('SELECT inventory_quantity FROM product_variants WHERE id = ?').get(variantId) as any;
    if (!v) throw AppError.notFound('Variant');
    return v.inventory_quantity;
  }

  async adjustInventory(variantId: string, delta: number): Promise<number> {
    const v = this.db.prepare('SELECT inventory_quantity FROM product_variants WHERE id = ?').get(variantId) as any;
    if (!v) throw AppError.notFound('Variant');

    const newQty = v.inventory_quantity + delta;
    if (newQty < 0) throw AppError.badRequest('Insufficient inventory');

    this.db.prepare('UPDATE product_variants SET inventory_quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newQty, variantId);
    return newQty;
  }

  // ============================================
  // Helpers
  // ============================================

  private generateSlug(title: string): string {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
    
    if (!slug) slug = uuidv4().substring(0, 8);
    
    // Ensure uniqueness
    const existing = this.db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
    if (existing) {
      slug = `${slug}-${uuidv4().substring(0, 4)}`;
    }
    
    return slug;
  }

  private buildCategoryTree(categories: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = map.get(cat.id);
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
