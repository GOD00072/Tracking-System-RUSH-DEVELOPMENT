import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Try to get token from multiple sources
  let token: string | null = null;

  // 1. Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check admin cookie (from admin login)
  if (!token && req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  // 3. Check user cookie (from LINE login)
  if (!token && req.cookies && req.cookies.user_token) {
    token = req.cookies.user_token;
  }

  // 4. Check legacy cookie (backward compatibility)
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 5. Check session user (from Passport)
  if (!token && req.isAuthenticated && req.isAuthenticated()) {
    const sessionUser = req.user as any;
    if (sessionUser && sessionUser.id) {
      req.user = {
        userId: sessionUser.id,
        email: sessionUser.email || '',
        role: sessionUser.role || 'customer',
      };
      return next();
    }
  }

  // If no token found, return unauthorized
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      },
    });
  }

  // Verify JWT token
  try {
    const decoded = jwt.verify(
      token,
      jwtConfig.secret
    ) as any;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
};

// Admin-only authentication middleware
// Only checks admin_token cookie and Authorization header
export const authenticateAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | null = null;

  // 1. Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check ONLY admin cookie (from admin login)
  if (!token && req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  // If no token found, return unauthorized
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Admin authentication required',
      },
    });
  }

  // Verify JWT token
  try {
    const decoded = jwt.verify(
      token,
      jwtConfig.secret
    ) as any;

    // Verify that the token is for an admin or staff user
    if (decoded.role !== 'admin' && decoded.role !== 'staff') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired admin token',
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      jwtConfig.secret
    ) as any;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    // For optional auth, we don't fail on invalid token
    // Just continue without user info
  }

  next();
};
