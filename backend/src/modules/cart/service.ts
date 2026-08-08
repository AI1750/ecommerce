import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import { AppError } from '../_shared/errors';
import { ProductService } from '../product/service';

export class CartService {
  private db: Database.Database;
  private productService: ProductService;

  constructor(db: Database.Database, productService: ProductService) {
    this.db = db;
    this.productService = productService;
  }

  async create(customerId?: string, email?: string): Promise<any> {
    const id = uuidv4();
    this.db.prepare(
      'INSERT INTO carts (id, customer_id, email) VALUES (?, ?, ?)'
    ).run(id, customerId || null, email || null);
    return this.retrieve(id);
  }

  async retrieve(cartId: string): Promise<any> {
    const cart = this.db.prepare('SELECT * FROM carts WHERE id = ?').get(cartId) as any;
    if (!cart) throw AppError.notFound('Cart');

    const items = this.db.prepare('SELECT * FROM cart_items WHERE cart_id = ?').all(cartId) as any[];
    const enrichedItems = [];

    let subtotal = 0;
    for (const item of items) {
      try {
        const variant = this.db.prepare('SELECT * FROM product_variants WHERE id = ?').get(item.variant_id) as any;
        if (variant) {
          // Update unit_price to current price
          if (variant.price !== item.unit_price) {
            this.db.prepare('UPDATE cart_items SET unit_price = ?, updated_at = datetime(\'now\') WHERE id = ?').run(variant.price, item.id);
            item.unit_price = variant.price;
          }
          const product = this.db.prepare('SELECT id, title, thumbnail, slug FROM products WHERE id = ?').get(variant.product_id) as any;
          const img = this.db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order LIMIT 1').get(variant.product_id) as any;
          enrichedItems.push({
            ...item,
            variant: {
              ...variant,
              product: { ...product, thumbnail: img?.url || null },
            },
          });
          subtotal += item.unit_price * item.quantity;
        }
      } catch {
        // Variant deleted, skip
      }
    }

    return {
      ...cart,
      items: enrichedItems,
      subtotal,
      itemCount: enrichedItems.reduce((sum, i) => sum + i.quantity, 0),
    };
  }

  async addItem(cartId: string, variantId: string, quantity: number = 1): Promise<any> {
    const cart = this.db.prepare('SELECT * FROM carts WHERE id = ?').get(cartId) as any;
    if (!cart) throw AppError.notFound('Cart');
    if (cart.status !== 'open') throw AppError.badRequest('Cart is not open');

    const variant = this.db.prepare('SELECT * FROM product_variants WHERE id = ? AND is_active = 1').get(variantId) as any;
    if (!variant) throw AppError.notFound('Variant');

    // Check inventory
    if (variant.inventory_quantity < quantity) {
      throw AppError.badRequest(`Only ${variant.inventory_quantity} in stock`);
    }

    // Check if already in cart
    const existing = this.db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND variant_id = ?').get(cartId, variantId) as any;
    if (existing) {
      const newQty = existing.quantity + quantity;
      this.db.prepare('UPDATE cart_items SET quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newQty, existing.id);
    } else {
      this.db.prepare(
        'INSERT INTO cart_items (id, cart_id, variant_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)'
      ).run(uuidv4(), cartId, variantId, quantity, variant.price);
    }

    // Update cart timestamp
    this.db.prepare("UPDATE carts SET updated_at = datetime('now') WHERE id = ?").run(cartId);

    const updatedCart = await this.retrieve(cartId);
    return { cart: updatedCart };
  }

  async updateItem(cartId: string, itemId: string, quantity: number): Promise<any> {
    const item = this.db.prepare('SELECT * FROM cart_items WHERE id = ? AND cart_id = ?').get(itemId, cartId) as any;
    if (!item) throw AppError.notFound('Cart item');

    if (quantity <= 0) {
      this.db.prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);
    } else {
      this.db.prepare('UPDATE cart_items SET quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').run(quantity, itemId);
    }

    this.db.prepare("UPDATE carts SET updated_at = datetime('now') WHERE id = ?").run(cartId);
    const updatedCart = await this.retrieve(cartId);
    return { cart: updatedCart };
  }

  async removeItem(cartId: string, itemId: string): Promise<any> {
    const item = this.db.prepare('SELECT * FROM cart_items WHERE id = ? AND cart_id = ?').get(itemId, cartId) as any;
    if (!item) throw AppError.notFound('Cart item');

    this.db.prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);
    this.db.prepare("UPDATE carts SET updated_at = datetime('now') WHERE id = ?").run(cartId);

    const updatedCart = await this.retrieve(cartId);
    return { cart: updatedCart };
  }

  async completeCart(cartId: string): Promise<void> {
    this.db.prepare("UPDATE carts SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(cartId);
  }
}
