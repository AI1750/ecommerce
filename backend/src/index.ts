import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { getDb, closeDb, Database } from './database/connection';
import { runMigrations } from './database/migrate';
import { errorHandler } from './middleware/errorHandler';

// Services
import { AuthService } from './modules/auth/service';
import { ProductService } from './modules/product/service';
import { CartService } from './modules/cart/service';
import { OrderService } from './modules/order/service';
import { CustomerService } from './modules/customer/service';
import { PaymentService } from './modules/payment/service';

// Routers
import { AuthRouter } from './modules/auth/router';
import { ProductRouter } from './modules/product/router';
import { CartRouter } from './modules/cart/router';
import { OrderRouter } from './modules/order/router';
import { CustomerRouter } from './modules/customer/router';
import { PaymentRouter } from './modules/payment/router';

const app = express();

// ============================================
// Global Middleware
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}
app.use('/uploads', express.static(config.uploadDir));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// Health Check
// ============================================
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ============================================
// Services Middleware (Dependency Injection)
// ============================================
app.use((req: any, _res, next) => {
  const db = app.locals.db as Database;
  const productService = new ProductService(db);
  const cartService = new CartService(db, productService);
  const customerService = new CustomerService(db);
  const orderService = new OrderService(db, cartService, productService);
  const paymentService = new PaymentService(db);

  req.services = {
    productService,
    cartService,
    orderService,
    customerService,
    paymentService,
  };
  next();
});

// ============================================
// Module Routes
// ============================================
function registerRouters() {
  const db = app.locals.db as Database;
  const productService = new ProductService(db);
  const cartService = new CartService(db, productService);
  const customerService = new CustomerService(db);
  const orderService = new OrderService(db, cartService, productService);
  const paymentService = new PaymentService(db);
  const authService = new AuthService(db);

  app.use('/api', new AuthRouter(authService).router);
  app.use('/api', new ProductRouter(productService).router);
  app.use('/api', new CartRouter(cartService).router);
  app.use('/api', new OrderRouter(orderService).router);
  app.use('/api', new CustomerRouter(customerService).router);
  app.use('/api', new PaymentRouter(paymentService).router);
}

// ============================================
// Error Handler (must be last)
// ============================================
app.use(errorHandler);

// ============================================
// Start Server
// ============================================
async function start() {
  try {
    // Initialize database
    const db = await getDb();
    app.locals.db = db;

    // Run database migrations
    await runMigrations();
    console.log('[Server] Database migrations complete');

    // Register routes (after db is ready)
    registerRouters();

    app.listen(config.port, () => {
      console.log(`[Server] Running on http://localhost:${config.port}`);
      console.log(`[Server] Health check: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Server] Shutting down...');
  await closeDb();
  process.exit(0);
});

start();

export default app;
