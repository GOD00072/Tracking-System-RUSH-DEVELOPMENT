import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import prisma from './lib/prisma';
import passport from './config/passport';

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
import airTrackingRouter from './routes/airTracking';
import orderItemsRouter from './routes/orderItems';
import systemSettingsRouter from './routes/systemSettings';
import trackingRouter from './routes/tracking';
import invoiceRouter from './routes/invoice';
// 🆕 New routes for enhanced features
import paymentsRouter from './routes/payments';
import uploadRouter from './routes/upload';
import path from 'path';

// Admin Routes
import adminOrdersRouter from './routes/admin/orders';

// Webhook Routes
import lineWebhookRouter from './routes/webhook/line';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

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

// Regular JSON parsing for all routes EXCEPT LINE webhook
app.use((req, res, next) => {
  if (req.path === '/webhook/line') {
    // Skip body parsing for LINE webhook - it will handle it internally
    return next();
  }
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Trust proxy (needed for secure cookies behind nginx/cloudflare)
app.set('trust proxy', 1);

// Session configuration
app.use(
  session({
    secret: process.env.JWT_SECRET || 'dev-secret-key',
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

// Rate limiting (relaxed for development)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // limit each IP to 500 requests per minute
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
});
app.use(limiter);

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
app.use('/auth', authRouter);
console.log('[INDEX] Auth routes registered');
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/shipments', shipmentsRouter);
app.use('/api/v1/schedules', schedulesRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/calculator', calculatorRouter);
app.use('/api/v1/statistics', statisticsRouter);
app.use('/api/v1/contact', contactRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/air-tracking', airTrackingRouter);
app.use('/api/v1/order-items', orderItemsRouter);
app.use('/api/v1/system-settings', systemSettingsRouter);
app.use('/api/v1/tracking', trackingRouter); // Public tracking portal
app.use('/api/v1/invoice', invoiceRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/upload', uploadRouter);

// Admin API Routes
app.use('/api/v1/admin/orders', adminOrdersRouter);

// Webhook Routes
app.use('/webhook/line', lineWebhookRouter);

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
