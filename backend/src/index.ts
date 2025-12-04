import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports that need them
dotenv.config();

import rateLimit from 'express-rate-limit';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import prisma from './lib/prisma';
import passport from './config/passport';
import { jwtConfig } from './config/jwt';

// Routes
console.log('[INDEX] Importing auth router...');
import authRouter from './routes/auth';
console.log('[INDEX] Auth router imported:', typeof authRouter);
import ordersRouter from './routes/orders';
import customersRouter from './routes/customers';
import shipmentsRouter from './routes/shipments';
import schedulesRouter from './routes/schedules';
import reviewsRouter from './routes/reviews';
import calculatorRouter from './routes/calculator';
import statisticsRouter from './routes/statistics';
import contactRouter from './routes/contact';
import settingsRouter from './routes/settings';
// import airTrackingRouter from './routes/airTracking'; // REMOVED: Not used, no auth
import orderItemsRouter from './routes/orderItems';
import systemSettingsRouter from './routes/systemSettings';
import trackingRouter from './routes/tracking';
import invoiceRouter from './routes/invoice';
// 🆕 New routes for enhanced features
import paymentsRouter from './routes/payments';
import uploadRouter from './routes/upload';
import notificationsRouter from './routes/notifications';
import tiersRouter from './routes/tiers';
import cloudinaryCleanupRouter from './routes/cloudinaryCleanup';
import auditRouter from './routes/audit';
import portfolioRouter from './routes/portfolio';
import mercariRouter from './routes/mercari';
import path from 'path';

// Admin Routes
import adminOrdersRouter from './routes/admin/orders';

// Webhook Routes
import lineWebhookRouter from './routes/webhook/line';
import lineOtpWebhookRouter from './routes/webhook/lineOtp';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Trust proxy FIRST - needed for rate limiting behind nginx/cloudflare
app.set('trust proxy', true);

// Static file serving for uploads - BEFORE helmet to avoid CORS issues
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(morgan('dev'));

// Regular JSON parsing for all routes EXCEPT LINE webhooks
app.use((req, res, next) => {
  if (req.path === '/webhook/line' || req.path === '/webhook/line-otp') {
    // Skip body parsing for LINE webhooks - they will handle it internally
    return next();
  }
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Trust proxy already set above

// Session configuration
app.use(
  session({
    secret: jwtConfig.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax', // Required for OAuth redirects
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Helper to get real IP from request
const getRealIp = (req: express.Request): string => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIp = req.headers['x-real-ip'];
  const reqIp = req.ip;

  // Debug log first 5 requests
  if (Math.random() < 0.1) {
    console.log(`[IP DEBUG] X-Forwarded-For: ${xForwardedFor}, X-Real-IP: ${xRealIp}, req.ip: ${reqIp}`);
  }

  if (typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }
  if (typeof xRealIp === 'string') {
    return xRealIp;
  }
  return reqIp || 'unknown';
};

// Global Rate limiting - uses req.ip which respects trust proxy
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRealIp(req),
  skip: (req) => req.path === '/health',
  handler: (req, res) => {
    console.log(`[RATE LIMIT] Blocked IP: ${getRealIp(req)} | Path: ${req.path}`);
    res.status(429).json({ success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' } });
  },
});
app.use(globalLimiter);
console.log('✅ Global rate limiter enabled: 60 req/min per IP');

// Strict rate limiting for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: { success: false, error: { code: 'AUTH_RATE_LIMIT', message: 'Too many login attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRealIp(req),
  handler: (req, res) => {
    console.log(`[AUTH RATE LIMIT] Blocked IP: ${getRealIp(req)} | Path: ${req.path}`);
    res.status(429).json({ success: false, error: { code: 'AUTH_RATE_LIMIT', message: 'Too many login attempts. Please try again in 15 minutes.' } });
  },
});

// Strict rate limiting for public forms (prevent spam)
const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 submissions per hour
  message: { success: false, error: { code: 'FORM_RATE_LIMIT', message: 'Too many submissions. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for upload routes
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 uploads per 10 minutes
  message: { success: false, error: { code: 'UPLOAD_RATE_LIMIT', message: 'Too many uploads. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes
console.log('[INDEX] Registering auth routes at /auth');
app.use('/auth', authLimiter, authRouter); // Strict rate limit for auth
console.log('[INDEX] Auth routes registered');
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/shipments', shipmentsRouter);
app.use('/api/v1/schedules', schedulesRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/calculator', calculatorRouter);
app.use('/api/v1/statistics', statisticsRouter);
app.use('/api/v1/contact', publicFormLimiter, contactRouter); // Strict rate limit for public forms
app.use('/api/v1/settings', settingsRouter);
// app.use('/api/v1/air-tracking', airTrackingRouter); // REMOVED: Not used
app.use('/api/v1/order-items', orderItemsRouter);
app.use('/api/v1/system-settings', systemSettingsRouter);
app.use('/api/v1/tracking', publicFormLimiter, trackingRouter); // Rate limit for public tracking lookups
app.use('/api/v1/invoice', invoiceRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/upload', uploadLimiter, uploadRouter); // Rate limit for uploads
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/tiers', tiersRouter);
app.use('/api/v1/cloudinary-cleanup', cloudinaryCleanupRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/mercari', mercariRouter);
app.use('/api/v1/portfolio', portfolioRouter);

// Admin API Routes
app.use('/api/v1/admin/orders', adminOrdersRouter);

// Webhook Routes
app.use('/webhook/line', lineWebhookRouter);
app.use('/webhook/line-otp', lineOtpWebhookRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS origins: ${process.env.ALLOWED_ORIGINS}`);

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
