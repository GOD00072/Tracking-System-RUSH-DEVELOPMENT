import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Routes
import ordersRouter from './routes/orders';
import shipmentsRouter from './routes/shipments';
import schedulesRouter from './routes/schedules';
import reviewsRouter from './routes/reviews';
import calculatorRouter from './routes/calculator';
import statisticsRouter from './routes/statistics';
import contactRouter from './routes/contact';
import settingsRouter from './routes/settings';
import airTrackingRouter from './routes/airTracking';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/shipments', shipmentsRouter);
app.use('/api/v1/schedules', schedulesRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/calculator', calculatorRouter);
app.use('/api/v1/statistics', statisticsRouter);
app.use('/api/v1/contact', contactRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/air-tracking', airTrackingRouter);

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS origins: ${process.env.ALLOWED_ORIGINS}`);
});

export default app;
