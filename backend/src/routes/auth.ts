import express from 'express';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';
import { createLoginHistory, createSecurityAlert } from '../middleware/auditLogger';

console.log('[AUTH ROUTES] Loading auth routes...');

const router = express.Router();

// Frontend URL for redirects
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5001';

console.log('[AUTH ROUTES] Router created');

// Admin Login (username/password)
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required',
        },
      });
    }

    // For demo: hardcoded admin credentials
    // TODO: Replace with database lookup and bcrypt password verification
    if (email === 'admin@shiptracking.com' && password === 'admin123') {
      const prisma = (await import('../lib/prisma')).default;

      // Find or create admin user in database
      let adminUser = await prisma.user.findUnique({
        where: { email: 'admin@shiptracking.com' },
      });

      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: 'admin@shiptracking.com',
            fullName: 'Admin User',
            role: 'admin',
          },
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
        },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: '7d' }
      );

      // Clear any existing user cookies to prevent conflicts
      res.clearCookie('user_token', { path: '/' });
      res.clearCookie('token', { path: '/' });

      // Set admin cookie (different name from user cookie)
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      // บันทึก Login History - สำเร็จ
      await createLoginHistory({
        userId: adminUser.id,
        userType: 'admin',
        email: adminUser.email || email,
        loginMethod: 'password',
        success: true,
        sessionId: token.substring(0, 20),
        req,
      });

      return res.json({
        success: true,
        data: {
          user: {
            id: adminUser.id,
            email: adminUser.email,
            fullName: adminUser.fullName,
            role: adminUser.role,
          },
          token: token,
        },
      });
    }

    // Invalid credentials - บันทึก Login History - ล้มเหลว
    await createLoginHistory({
      userType: 'admin',
      email: email,
      loginMethod: 'password',
      success: false,
      failReason: 'Invalid email or password',
      req,
    });

    // ตรวจสอบ failed login attempts - สร้าง Security Alert ถ้ามากเกินไป
    const prisma = (await import('../lib/prisma')).default;
    const recentFailedLogins = await prisma.loginHistory.count({
      where: {
        email: email,
        success: false,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // 15 นาทีล่าสุด
      },
    });

    if (recentFailedLogins >= 5) {
      await createSecurityAlert({
        alertType: 'failed_login',
        severity: 'medium',
        userEmail: email,
        description: `Multiple failed login attempts (${recentFailedLogins}) for email: ${email}`,
        metadata: { failedAttempts: recentFailedLogins },
        req,
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Failed to login',
      },
    });
  }
});

// Admin Logout
router.post('/admin/logout', async (req, res) => {
  try {
    // ดึง token จาก cookie หรือ header เพื่อบันทึก logout
    const token = req.cookies?.admin_token || req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
        const prisma = (await import('../lib/prisma')).default;

        // อัพเดท logoutAt ใน LoginHistory ล่าสุดของ user นี้
        await prisma.loginHistory.updateMany({
          where: {
            userId: decoded.userId,
            userType: 'admin',
            logoutAt: null,
          },
          data: {
            logoutAt: new Date(),
          },
        });
      } catch (e) {
        // Token invalid - ignore
      }
    }

    // Clear admin cookie
    res.clearCookie('admin_token', { path: '/' });
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error in admin logout:', error);
    res.clearCookie('admin_token', { path: '/' });
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
});

// LINE Login - Initiate
router.get('/line', passport.authenticate('line'));

console.log('[AUTH ROUTES] LINE route registered');

// LINE Callback
router.get(
  '/line/callback',
  passport.authenticate('line', {
    failureRedirect: `${FRONTEND_URL}?login=failed`,
    session: true,
  }),
  async (req, res) => {
    try {
      const user = req.user as any;

      if (!user) {
        // บันทึก Login History - ล้มเหลว (LINE)
        await createLoginHistory({
          userType: 'user',
          email: 'unknown',
          loginMethod: 'line',
          success: false,
          failReason: 'LINE authentication failed - no user',
          req,
        });
        return res.redirect(`${FRONTEND_URL}?login=failed`);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: '7d' }
      );

      // Clear any existing admin cookies to prevent conflicts
      res.clearCookie('admin_token', { path: '/' });

      // Set user cookie (different from admin cookie)
      res.cookie('user_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      // บันทึก Login History - สำเร็จ (LINE)
      await createLoginHistory({
        userId: user.id,
        userType: 'user',
        email: user.email || user.lineId || 'LINE User',
        loginMethod: 'line',
        success: true,
        sessionId: token.substring(0, 20),
        req,
      });

      // Redirect to frontend with token (for backward compatibility)
      res.redirect(`${FRONTEND_URL}?token=${token}&login=success`);
    } catch (error) {
      console.error('Error in LINE callback:', error);
      res.redirect(`${FRONTEND_URL}?login=failed`);
    }
  }
);

// Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;

    const prisma = (await import('../lib/prisma')).default;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        lineId: true,
        profilePicture: true,
        role: true,
        createdAt: true,
        customers: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            phone: true,
            address: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Transform customers array to single customer object for backward compatibility
    const userResponse = {
      ...user,
      customer: user.customers && user.customers.length > 0 ? user.customers[0] : null,
      customers: undefined,
    };

    res.json({
      success: true,
      data: userResponse,
    });
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

    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch user',
      },
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    // ดึง token จาก cookie หรือ header เพื่อบันทึก logout
    const token = req.cookies?.user_token || req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
        const prisma = (await import('../lib/prisma')).default;

        // อัพเดท logoutAt ใน LoginHistory ล่าสุดของ user นี้
        await prisma.loginHistory.updateMany({
          where: {
            userId: decoded.userId,
            userType: 'user',
            logoutAt: null,
          },
          data: {
            logoutAt: new Date(),
          },
        });
      } catch (e) {
        // Token invalid - ignore
      }
    }

    // Clear user cookie
    res.clearCookie('user_token', { path: '/' });

    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'LOGOUT_ERROR',
            message: 'Failed to logout',
          },
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  } catch (error) {
    console.error('Error in logout:', error);
    res.clearCookie('user_token', { path: '/' });
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
});

console.log('[AUTH ROUTES] All routes registered, exporting router');

export default router;
