import express from 'express';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { createLoginHistory, createSecurityAlert } from '../middleware/auditLogger';

console.log('[AUTH ROUTES] Loading auth routes...');

const router = express.Router();

// Frontend URL for redirects
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5001';

console.log('[AUTH ROUTES] Router created');

// Store pending logins with OTP codes (in-memory, expires in 5 minutes)
const pendingLogins = new Map<string, { email: string; userId: string; fullName: string; role: string; code: string; expiresAt: Date }>();

// Admin Login Step 1 - ตรวจสอบ email/password และส่ง OTP
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

    const prisma = (await import('../lib/prisma')).default;
    const bcrypt = (await import('bcryptjs')).default;

    // ค้นหา user จาก database
    let adminUser = await prisma.user.findUnique({
      where: { email },
    });

    let isValidPassword = false;

    // Verify password from database only (no hardcoded credentials)
    if (adminUser && adminUser.password) {
      isValidPassword = await bcrypt.compare(password, adminUser.password);
    }

    // ตรวจสอบว่าเป็น admin หรือ staff
    if (isValidPassword && adminUser && (adminUser.role === 'admin' || adminUser.role === 'staff')) {
      // Generate 6-digit OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store pending login
      pendingLogins.set(email, {
        email,
        userId: adminUser.id,
        fullName: adminUser.fullName || 'Admin',
        role: adminUser.role,
        code,
        expiresAt,
      });

      // Send OTP to LINE group
      const { lineOtpService } = await import('../services/lineOtpService');
      await lineOtpService.sendLoginOtpToGroup(code, adminUser.fullName || email, email);

      // Security: Never log OTP codes in production
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Auth] Login OTP requested for ${email}`);
      }

      return res.json({
        success: true,
        requireOtp: true,
        message: 'OTP ถูกส่งไปยังกลุ่มแอดมินแล้ว',
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

// Admin Login Step 2 - ยืนยัน OTP และเข้าสู่ระบบ
router.post('/admin/verify-login', async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'กรุณากรอกอีเมลและ OTP',
        },
      });
    }

    // ตรวจสอบ pending login
    const pending = pendingLogins.get(email);

    if (!pending) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_PENDING_LOGIN',
          message: 'ไม่พบการขอเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่',
        },
      });
    }

    // ตรวจสอบว่าหมดอายุหรือไม่
    if (new Date() > pending.expiresAt) {
      pendingLogins.delete(email);
      return res.status(400).json({
        success: false,
        error: {
          code: 'OTP_EXPIRED',
          message: 'OTP หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่',
        },
      });
    }

    // ตรวจสอบ OTP
    if (otpCode !== pending.code) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'OTP ไม่ถูกต้อง',
        },
      });
    }

    // OTP ถูกต้อง - ลบ pending login
    pendingLogins.delete(email);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: pending.userId,
        email: pending.email,
        role: pending.role,
      },
      jwtConfig.secret,
      { expiresIn: '7d' }
    );

    // Set admin cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // บันทึก Login History - สำเร็จ
    await createLoginHistory({
      userId: pending.userId,
      userType: 'admin',
      email: pending.email,
      loginMethod: 'password',
      success: true,
      sessionId: token.substring(0, 20),
      req,
    });

    console.log(`[Auth] Login OTP verified for ${email}`);

    return res.json({
      success: true,
      data: {
        user: {
          id: pending.userId,
          email: pending.email,
          full_name: pending.fullName,
          role: pending.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error in verify login OTP:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'VERIFY_ERROR',
        message: 'เกิดข้อผิดพลาดในการยืนยัน OTP',
      },
    });
  }
});

// Store pending registrations with OTP codes (in-memory, expires in 10 minutes)
const pendingRegistrations = new Map<string, { email: string; password: string; fullName: string; code: string; expiresAt: Date }>();

// Request Staff Code - Step 1: ขอโค้ด (ส่งไปกลุ่ม LINE)
router.post('/admin/request-code', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
        },
      });
    }

    const prisma = (await import('../lib/prisma')).default;

    // ตรวจสอบว่า email ซ้ำหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'อีเมลนี้มีผู้ใช้งานแล้ว',
        },
      });
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store pending registration
    pendingRegistrations.set(email, {
      email,
      password,
      fullName,
      code,
      expiresAt,
    });

    // Send to LINE group
    const { lineOtpService } = await import('../services/lineOtpService');
    await lineOtpService.sendStaffCodeToGroup(code, fullName, email);

    // Security: Never log staff codes in production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auth] Staff code requested for ${email}`);
    }

    return res.json({
      success: true,
      message: 'โค้ดพนักงานถูกส่งไปยังกลุ่มแอดมินแล้ว กรุณารอรับโค้ดจากแอดมิน',
    });
  } catch (error) {
    console.error('Error requesting staff code:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REQUEST_ERROR',
        message: 'เกิดข้อผิดพลาดในการขอโค้ดพนักงาน',
      },
    });
  }
});

// Admin Register - Step 2: ยืนยันโค้ดและสมัคร
router.post('/admin/register', async (req, res) => {
  try {
    const { email, staffCode } = req.body;

    if (!email || !staffCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'กรุณากรอกอีเมลและโค้ดพนักงาน',
        },
      });
    }

    // ตรวจสอบ pending registration
    const pending = pendingRegistrations.get(email);

    if (!pending) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_PENDING_REGISTRATION',
          message: 'ไม่พบการขอสมัคร กรุณาขอโค้ดใหม่',
        },
      });
    }

    // ตรวจสอบว่าหมดอายุหรือไม่
    if (new Date() > pending.expiresAt) {
      pendingRegistrations.delete(email);
      return res.status(400).json({
        success: false,
        error: {
          code: 'CODE_EXPIRED',
          message: 'โค้ดหมดอายุแล้ว กรุณาขอโค้ดใหม่',
        },
      });
    }

    // ตรวจสอบโค้ด
    if (staffCode !== pending.code) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_STAFF_CODE',
          message: 'โค้ดพนักงานไม่ถูกต้อง',
        },
      });
    }

    const prisma = (await import('../lib/prisma')).default;
    const bcrypt = (await import('bcryptjs')).default;

    // Hash password from pending registration
    const hashedPassword = await bcrypt.hash(pending.password, 10);

    // สร้าง user ใหม่
    const newUser = await prisma.user.create({
      data: {
        email: pending.email,
        fullName: pending.fullName,
        password: hashedPassword,
        role: 'staff', // สมัครใหม่เป็น staff ไม่ใช่ admin
      },
    });

    // ลบ pending registration
    pendingRegistrations.delete(email);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      jwtConfig.secret,
      { expiresIn: '7d' }
    );

    // Set admin cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error in admin register:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REGISTER_ERROR',
        message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
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
        const decoded = jwt.verify(token, jwtConfig.secret) as any;
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

    // Clear admin cookie - must match options used when setting
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error in admin logout:', error);
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
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
        jwtConfig.secret,
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
    const decoded = jwt.verify(token, jwtConfig.secret) as any;

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
        const decoded = jwt.verify(token, jwtConfig.secret) as any;
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
