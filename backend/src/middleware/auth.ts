import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';
import { AppError } from '../modules/_shared/errors';

/**
 * Verify JWT from Authorization header and attach user to request.
 * Token format: Bearer <token>
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function authenticateAdmin(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (!token) {
      throw AppError.unauthorized('Admin authentication required');
    }

    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (payload.type !== 'admin') {
      throw AppError.forbidden('Admin access required');
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid or expired token'));
    } else {
      next(error);
    }
  }
}

export function authenticateCustomer(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (!token) {
      throw AppError.unauthorized('Customer authentication required');
    }

    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (payload.type !== 'store') {
      throw AppError.forbidden('Customer access required');
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid or expired token'));
    } else {
      next(error);
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
      req.user = payload;
    }
    next();
  } catch {
    // Token invalid, continue without auth
    next();
  }
}
