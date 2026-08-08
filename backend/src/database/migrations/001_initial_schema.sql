-- ============================================
-- 用户与认证
-- ============================================

CREATE TABLE users (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name  TEXT,
    last_name   TEXT,
    role        TEXT NOT NULL DEFAULT 'admin',
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE customers (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    phone       TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE addresses (
    id          TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id),
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    address_1   TEXT NOT NULL,
    address_2   TEXT,
    city        TEXT NOT NULL,
    province    TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country     TEXT NOT NULL DEFAULT 'CN',
    phone       TEXT,
    is_default  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- 产品模块
-- ============================================

CREATE TABLE categories (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    slug        TEXT NOT NULL UNIQUE,
    parent_id   TEXT REFERENCES categories(id),
    image       TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE products (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    subtitle    TEXT,
    description TEXT,
    slug        TEXT NOT NULL UNIQUE,
    category_id TEXT REFERENCES categories(id),
    thumbnail   TEXT,
    status      TEXT NOT NULL DEFAULT 'draft',
    weight      REAL,
    is_giftcard INTEGER NOT NULL DEFAULT 0,
    discountable INTEGER NOT NULL DEFAULT 1,
    metadata    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE product_images (
    id          TEXT PRIMARY KEY,
    product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    alt_text    TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE product_options (
    id          TEXT PRIMARY KEY,
    product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE product_option_values (
    id          TEXT PRIMARY KEY,
    option_id   TEXT NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    value       TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE product_variants (
    id          TEXT PRIMARY KEY,
    product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    sku         TEXT,
    barcode     TEXT,
    price       REAL NOT NULL,
    compare_at_price REAL,
    cost_price  REAL,
    inventory_quantity INTEGER NOT NULL DEFAULT 0,
    weight      REAL,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE variant_option_values (
    id          TEXT PRIMARY KEY,
    variant_id  TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    option_value_id TEXT NOT NULL REFERENCES product_option_values(id) ON DELETE CASCADE,
    UNIQUE(variant_id, option_value_id)
);

-- ============================================
-- 购物车模块
-- ============================================

CREATE TABLE carts (
    id          TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    email       TEXT,
    status      TEXT NOT NULL DEFAULT 'open',
    currency    TEXT NOT NULL DEFAULT 'CNY',
    metadata    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE cart_items (
    id          TEXT PRIMARY KEY,
    cart_id     TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    variant_id  TEXT NOT NULL REFERENCES product_variants(id),
    quantity    INTEGER NOT NULL DEFAULT 1,
    unit_price  REAL NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(cart_id, variant_id)
);

-- ============================================
-- 订单模块
-- ============================================

CREATE TABLE orders (
    id              TEXT PRIMARY KEY,
    customer_id     TEXT REFERENCES customers(id),
    email           TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    currency        TEXT NOT NULL DEFAULT 'CNY',
    subtotal        REAL NOT NULL,
    shipping_total  REAL NOT NULL DEFAULT 0,
    tax_total       REAL NOT NULL DEFAULT 0,
    discount_total  REAL NOT NULL DEFAULT 0,
    grand_total     REAL NOT NULL,
    shipping_address_id TEXT REFERENCES addresses(id),
    billing_address_id  TEXT REFERENCES addresses(id),
    payment_status  TEXT NOT NULL DEFAULT 'pending',
    payment_method  TEXT,
    notes           TEXT,
    metadata        TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE order_items (
    id              TEXT PRIMARY KEY,
    order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id      TEXT NOT NULL,
    product_title   TEXT NOT NULL,
    variant_title   TEXT NOT NULL,
    sku             TEXT,
    quantity        INTEGER NOT NULL,
    unit_price      REAL NOT NULL,
    total_price     REAL NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE order_status_history (
    id          TEXT PRIMARY KEY,
    order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status      TEXT NOT NULL,
    note        TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- 支付模块
-- ============================================

CREATE TABLE payments (
    id              TEXT PRIMARY KEY,
    order_id        TEXT NOT NULL REFERENCES orders(id),
    amount          REAL NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'CNY',
    method          TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    transaction_id  TEXT,
    metadata        TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- 索引
-- ============================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_carts_customer ON carts(customer_id);
CREATE INDEX idx_addresses_customer ON addresses(customer_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
