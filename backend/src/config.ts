import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'ecommerce-jwt-secret-key-2024',
  jwtAdminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '24h',
  jwtCustomerExpiresIn: process.env.JWT_CUSTOMER_EXPIRES_IN || '7d',
  dbPath: path.resolve(__dirname, '..', process.env.DB_PATH || './data/ecommerce.db'),
  uploadDir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads'),
};
