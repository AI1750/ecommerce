import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, closeDb } from './connection';
import { runMigrations } from './migrate';

export async function runSeed() {
  console.log('[Seed] Running migrations...');
  await runMigrations();

  const db = await getDb();
  console.log('[Seed] Starting seed data...');

  // Clear existing data
  db.exec(`
    DELETE FROM variant_option_values;
    DELETE FROM variant_option_values;
    DELETE FROM product_variants;
    DELETE FROM product_option_values;
    DELETE FROM product_options;
    DELETE FROM product_images;
    DELETE FROM cart_items;
    DELETE FROM carts;
    DELETE FROM order_items;
    DELETE FROM order_status_history;
    DELETE FROM payments;
    DELETE FROM orders;
    DELETE FROM addresses;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM customers;
    DELETE FROM users;
  `);

  // ============================================
  // Admin User
  // ============================================
  const adminHash = await bcrypt.hash('admin123', 10);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, role)
    VALUES (?, ?, ?, ?, ?, 'admin')
  `).run(uuidv4(), 'admin@example.com', adminHash, 'Admin', 'User');
  console.log('[Seed] Admin user created: admin@example.com / admin123');

  // ============================================
  // Test Customer
  // ============================================
  const custId = uuidv4();
  const custHash = await bcrypt.hash('customer123', 10);
  db.prepare(`
    INSERT INTO customers (id, email, password_hash, first_name, last_name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(custId, 'customer@example.com', custHash, '张', '三', '13800138000');
  console.log('[Seed] Customer created: customer@example.com / customer123');

  // Customer address
  const addrId = uuidv4();
  db.prepare(`
    INSERT INTO addresses (id, customer_id, first_name, last_name, address_1, city, province, postal_code, phone, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(addrId, custId, '张', '三', '朝阳区建国路100号', '北京', '北京市', '100000', '13800138000');
  console.log('[Seed] Customer address created');

  // ============================================
  // Categories
  // ============================================
  const cat1 = uuidv4();
  const cat2 = uuidv4();
  const cat3 = uuidv4();
  const cat4 = uuidv4();
  const cat5 = uuidv4();

  db.prepare('INSERT INTO categories (id, name, description, slug, sort_order) VALUES (?, ?, ?, ?, ?)').run(cat1, '电子产品', '手机、电脑、数码配件', 'electronics', 0);
  db.prepare('INSERT INTO categories (id, name, description, slug, sort_order) VALUES (?, ?, ?, ?, ?)').run(cat2, '服装', '男女服装、鞋帽配饰', 'clothing', 1);
  db.prepare('INSERT INTO categories (id, name, description, slug, sort_order) VALUES (?, ?, ?, ?, ?)').run(cat3, '家居生活', '家具、家纺、厨具', 'home-living', 2);
  db.prepare('INSERT INTO categories (id, name, description, slug, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(cat4, '手机', '智能手机及配件', 'phones', cat1, 0);
  db.prepare('INSERT INTO categories (id, name, description, slug, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(cat5, '电脑', '笔记本及周边', 'computers', cat1, 1);

  // ============================================
  // Products with Variants
  // ============================================

  // Product 1: Smartphone
  const p1 = uuidv4();
  db.prepare(`INSERT INTO products (id, title, subtitle, description, slug, category_id, status, weight)
    VALUES (?, ?, ?, ?, ?, ?, 'published', ?)`).run(p1,
    '智能手机 Pro Max', '2024旗舰新品', '高性能旗舰智能手机，搭载最新处理器，拥有出色的拍照能力和超长续航。6.7英寸OLED屏幕，120Hz刷新率。',
    'smartphone-pro-max', cat4, 200);

  const p1opt1 = uuidv4();
  db.prepare('INSERT INTO product_options (id, product_id, title) VALUES (?, ?, ?)').run(p1opt1, p1, '颜色');
  const p1opt1v1 = uuidv4();
  const p1opt1v2 = uuidv4();
  const p1opt1v3 = uuidv4();
  db.prepare('INSERT INTO product_option_values (id, option_id, value, sort_order) VALUES (?, ?, ?, ?)').run(p1opt1v1, p1opt1, '深空黑', 0);
  db.prepare('INSERT INTO product_option_values (id, option_id, value, sort_order) VALUES (?, ?, ?, ?)').run(p1opt1v2, p1opt1, '星光白', 1);
  db.prepare('INSERT INTO product_option_values (id, option_id, value, sort_order) VALUES (?, ?, ?, ?)').run(p1opt1v3, p1opt1, '远峰蓝', 2);

  const p1opt2 = uuidv4();
  db.prepare('INSERT INTO product_options (id, product_id, title) VALUES (?, ?, ?)').run(p1opt2, p1, '存储');
  const p1opt2v1 = uuidv4();
  const p1opt2v2 = uuidv4();
  db.prepare('INSERT INTO product_option_values (id, option_id, value, sort_order) VALUES (?, ?, ?, ?)').run(p1opt2v1, p1opt2, '128GB', 0);
  db.prepare('INSERT INTO product_option_values (id, option_id, value, sort_order) VALUES (?, ?, ?, ?)').run(p1opt2v2, p1opt2, '256GB', 1);

  // Variants for product 1
  const variants = [
    { title: '深空黑 / 128GB', sku: 'SPM-BLK-128', price: 499900, compare: 599900, qty: 100, ovs: [p1opt1v1, p1opt2v1] },
    { title: '深空黑 / 256GB', sku: 'SPM-BLK-256', price: 599900, compare: 699900, qty: 80, ovs: [p1opt1v1, p1opt2v2] },
    { title: '星光白 / 128GB', sku: 'SPM-WHT-128', price: 499900, compare: 599900, qty: 120, ovs: [p1opt1v2, p1opt2v1] },
    { title: '星光白 / 256GB', sku: 'SPM-WHT-256', price: 599900, compare: 699900, qty: 60, ovs: [p1opt1v2, p1opt2v2] },
    { title: '远峰蓝 / 128GB', sku: 'SPM-BLU-128', price: 499900, compare: 599900, qty: 50, ovs: [p1opt1v3, p1opt2v1] },
    { title: '远峰蓝 / 256GB', sku: 'SPM-BLU-256', price: 599900, compare: 699900, qty: 40, ovs: [p1opt1v3, p1opt2v2] },
  ];

  for (const v of variants) {
    const vid = uuidv4();
    db.prepare(`INSERT INTO product_variants (id, product_id, title, sku, price, compare_at_price, inventory_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(vid, p1, v.title, v.sku, v.price, v.compare, v.qty);
    for (const ovId of v.ovs) {
      db.prepare('INSERT INTO variant_option_values (id, variant_id, option_value_id) VALUES (?, ?, ?)')
        .run(uuidv4(), vid, ovId);
    }
  }

  // Product images for p1
  db.prepare('INSERT INTO product_images (id, product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), p1, 'https://picsum.photos/seed/phone1/600/600', '智能手机正面', 0);
  db.prepare('INSERT INTO product_images (id, product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), p1, 'https://picsum.photos/seed/phone2/600/600', '智能手机背面', 1);
  db.prepare('INSERT INTO product_images (id, product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), p1, 'https://picsum.photos/seed/phone3/600/600', '智能手机侧面', 2);

  // ============================================
  // More products - simplified
  // ============================================
  const moreProducts = [
    { title: '轻薄笔记本电脑', subtitle: '办公娱乐两不误', desc: '14英寸2K屏幕，最新处理器，16GB内存，512GB SSD，超长续航12小时。', slug: 'laptop-slim', cat: cat5, weight: 1500, price: 599900, compare: 699900, qty: 50, img: 'laptop' },
    { title: '无线降噪耳机', subtitle: '沉浸式音乐体验', desc: '主动降噪，30小时续航，Hi-Res认证音质。', slug: 'wireless-earbuds', cat: cat1, weight: 50, price: 89900, compare: 129900, qty: 200, img: 'earbuds' },
    { title: '男士休闲夹克', subtitle: '春秋必备单品', desc: '优质面料，舒适透气，简约时尚设计。', slug: 'mens-jacket', cat: cat2, weight: 500, price: 29900, compare: 39900, qty: 150, img: 'jacket' },
    { title: '女士连衣裙', subtitle: '优雅气质之选', desc: '轻薄面料，收腰设计，适合各种场合穿着。', slug: 'womens-dress', cat: cat2, weight: 300, price: 25900, compare: 35900, qty: 180, img: 'dress' },
    { title: '智能手表', subtitle: '健康生活管家', desc: '全天候心率监测，血氧检测，多种运动模式，7天续航。', slug: 'smart-watch', cat: cat1, weight: 60, price: 199900, compare: 249900, qty: 100, img: 'watch' },
    { title: '真皮沙发', subtitle: '客厅品质之选', desc: '意大利进口头层牛皮，高密度海绵，实木框架。', slug: 'leather-sofa', cat: cat3, weight: 50000, price: 399900, compare: 499900, qty: 10, img: 'sofa' },
    { title: '智能扫地机器人', subtitle: '解放双手', desc: '激光导航，自动回充，APP远程控制，扫拖一体。', slug: 'robot-vacuum', cat: cat3, weight: 3500, price: 249900, compare: 299900, qty: 80, img: 'vacuum' },
    { title: '运动跑鞋', subtitle: '轻盈舒适', desc: '透气飞织鞋面，缓震中底，适合日常跑步健身。', slug: 'running-shoes', cat: cat2, weight: 300, price: 39900, compare: 49900, qty: 200, img: 'shoes' },
    { title: '平板电脑', subtitle: '学习娱乐利器', desc: '11英寸全面屏，支持手写笔，轻薄便携。', slug: 'tablet-pc', cat: cat5, weight: 460, price: 329900, compare: 399900, qty: 70, img: 'tablet' },
    { title: '不锈钢保温杯', subtitle: '长效保温', desc: '316不锈钢内胆，12小时保温，简约设计。', slug: 'thermos-cup', cat: cat3, weight: 250, price: 9900, compare: 14900, qty: 500, img: 'cup' },
    { title: '蓝牙音箱', subtitle: '便携好音质', desc: 'IPX7防水，20小时续航，360度环绕立体声。', slug: 'bluetooth-speaker', cat: cat1, weight: 540, price: 29900, compare: 39900, qty: 150, img: 'speaker' },
    { title: '羽绒服', subtitle: '温暖过冬', desc: '90%白鹅绒填充，防风防水面料，轻盈保暖。', slug: 'down-jacket', cat: cat2, weight: 800, price: 89900, compare: 129900, qty: 100, img: 'down' },
  ];

  for (const mp of moreProducts) {
    const pid = uuidv4();
    db.prepare(`INSERT INTO products (id, title, subtitle, description, slug, category_id, status, weight)
      VALUES (?, ?, ?, ?, ?, ?, 'published', ?)`).run(pid, mp.title, mp.subtitle, mp.desc, mp.slug, mp.cat, mp.weight);

    // Single default variant
    const vid = uuidv4();
    const sku = `${mp.slug.toUpperCase()}-DEFAULT`;
    db.prepare(`INSERT INTO product_variants (id, product_id, title, sku, price, compare_at_price, inventory_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(vid, pid, '默认', sku, mp.price, mp.compare, mp.qty);

    // Product image
    db.prepare('INSERT INTO product_images (id, product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), pid, `https://picsum.photos/seed/${mp.img}/600/600`, mp.title, 0);
  }

  // ============================================
  // Sample Orders
  // ============================================
  const order1Id = uuidv4();
  db.prepare(`INSERT INTO orders (id, customer_id, email, status, subtotal, shipping_total, grand_total, shipping_address_id, payment_status, payment_method)
    VALUES (?, ?, ?, 'delivered', 499900, 1000, 500900, ?, 'paid', 'mock_wechat')`).run(order1Id, custId, 'customer@example.com', addrId);

  const oi1 = uuidv4();
  // Get first variant of first product
  const firstVariant = db.prepare('SELECT id, title, sku FROM product_variants LIMIT 1').get() as any;
  db.prepare(`INSERT INTO order_items (id, order_id, variant_id, product_title, variant_title, sku, quantity, unit_price, total_price)
    VALUES (?, ?, ?, '智能手机 Pro Max', ?, ?, 1, 499900, 499900)`).run(oi1, order1Id, firstVariant.id, firstVariant.title, firstVariant.sku);

  db.prepare("INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'pending', 'Order created')").run(uuidv4(), order1Id);
  db.prepare("INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'confirmed', 'Payment received')").run(uuidv4(), order1Id);
  db.prepare("INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'processing', 'Order processing')").run(uuidv4(), order1Id);
  db.prepare("INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'shipped', 'Package shipped')").run(uuidv4(), order1Id);
  db.prepare("INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'delivered', 'Package delivered')").run(uuidv4(), order1Id);

  // Payment record
  db.prepare(`INSERT INTO payments (id, order_id, amount, currency, method, status, transaction_id)
    VALUES (?, ?, 500900, 'CNY', 'mock_wechat', 'completed', ?)`).run(uuidv4(), order1Id, `TXN${Date.now()}ABC`);

  // Second sample order
  const order2Id = uuidv4();
  db.prepare(`INSERT INTO orders (id, customer_id, email, status, subtotal, shipping_total, grand_total, shipping_address_id, payment_status, payment_method)
    VALUES (?, ?, ?, 'processing', 599900, 1000, 600900, ?, 'paid', 'mock_alipay')`).run(order2Id, custId, 'customer@example.com', addrId);

  const secondVariant = db.prepare('SELECT id, title, sku FROM product_variants LIMIT 1 OFFSET 1').get() as any;
  db.prepare(`INSERT INTO order_items (id, order_id, variant_id, product_title, variant_title, sku, quantity, unit_price, total_price)
    VALUES (?, ?, ?, '智能手机 Pro Max', ?, ?, 1, 599900, 599900)`).run(uuidv4(), order2Id, secondVariant.id, secondVariant.title, secondVariant.sku);

  db.prepare("INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'pending', 'Order created')").run(uuidv4(), order2Id);
  db.prepare("INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'confirmed', 'Payment received')").run(uuidv4(), order2Id);
  db.prepare("INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'processing', 'Order processing')").run(uuidv4(), order2Id);

  db.prepare(`INSERT INTO payments (id, order_id, amount, currency, method, status, transaction_id)
    VALUES (?, ?, 600900, 'CNY', 'mock_alipay', 'completed', ?)`).run(uuidv4(), order2Id, `TXN${Date.now()}DEF`);

  console.log('[Seed] Seed data complete!');
  console.log('[Seed] ========================================');
  console.log('[Seed] Admin: admin@example.com / admin123');
  console.log('[Seed] Customer: customer@example.com / customer123');
  console.log('[Seed] Products: 13 products created');
  console.log('[Seed] Categories: 5 categories created');
  console.log('[Seed] Orders: 2 sample orders created');
  console.log('[Seed] ========================================');

  await closeDb();
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  });
}
