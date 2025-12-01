import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth';

// Resource type mapping from API paths
const RESOURCE_TYPE_MAP: Record<string, string> = {
  '/customers': 'customer',
  '/orders': 'order',
  '/order-items': 'order_item',
  '/payments': 'payment',
  '/settings': 'settings',
  '/tiers': 'tier',
  '/reviews': 'review',
  '/schedules': 'schedule',
  '/upload': 'upload',
  '/statistics': 'statistics',
  '/notifications': 'notification',
};

// Action mapping from HTTP methods
const ACTION_MAP: Record<string, string> = {
  GET: 'view',
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

// Fields that should be redacted from logs (PII)
const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'apiKey', 'api_key',
  'creditCard', 'credit_card', 'cardNumber', 'card_number',
  'cvv', 'ssn', 'socialSecurity',
];

// Redact sensitive fields from objects
function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const redacted = { ...obj };
  for (const key of Object.keys(redacted)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }
  return redacted;
}

// Get resource type from path
function getResourceType(path: string): string {
  for (const [prefix, type] of Object.entries(RESOURCE_TYPE_MAP)) {
    if (path.includes(prefix)) {
      return type;
    }
  }
  return 'unknown';
}

// Extract resource ID from path (e.g., /customers/123 -> 123)
function extractResourceId(path: string): string | null {
  const parts = path.split('/');
  // Look for UUID pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const part of parts) {
    if (uuidRegex.test(part)) {
      return part;
    }
  }
  return null;
}

// Get changed fields between old and new values
function getChangedFields(oldValue: any, newValue: any): string[] {
  if (!oldValue || !newValue) return [];

  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

  for (const key of allKeys) {
    if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
      changed.push(key);
    }
  }
  return changed;
}

// Parse User-Agent to extract device info
function parseUserAgent(userAgent: string | undefined): { deviceType: string; browser: string; os: string } {
  if (!userAgent) {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }

  // Simple device type detection
  let deviceType = 'desktop';
  if (/mobile/i.test(userAgent)) deviceType = 'mobile';
  else if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';

  // Simple browser detection
  let browser = 'unknown';
  if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent)) browser = 'Safari';
  else if (/edge/i.test(userAgent)) browser = 'Edge';

  // Simple OS detection
  let os = 'unknown';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/mac os/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/ios|iphone|ipad/i.test(userAgent)) os = 'iOS';

  return { deviceType, browser, os };
}

// Get client IP address
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

// Interface for audit log creation
interface AuditLogParams {
  adminEmail: string;
  adminId?: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  resourceName?: string | null;
  description?: string;
  oldValue?: any;
  newValue?: any;
  req: Request;
  statusCode?: number;
  duration?: number;
}

// Create audit log entry
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const changedFields = getChangedFields(params.oldValue, params.newValue);

    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId || null,
        adminEmail: params.adminEmail,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        resourceName: params.resourceName || null,
        description: params.description || null,
        oldValue: params.oldValue ? redactSensitiveData(params.oldValue) : null,
        newValue: params.newValue ? redactSensitiveData(params.newValue) : null,
        changedFields,
        ipAddress: getClientIp(params.req),
        userAgent: params.req.headers['user-agent'] || null,
        requestMethod: params.req.method,
        requestPath: params.req.originalUrl || params.req.path,
        statusCode: params.statusCode || null,
        duration: params.duration || null,
      },
    });
  } catch (error) {
    console.error('[AuditLogger] Failed to create audit log:', error);
  }
}

// Create login history entry
export async function createLoginHistory(params: {
  userId?: string;
  userType: 'user' | 'admin';
  email: string;
  loginMethod: string;
  success: boolean;
  failReason?: string;
  sessionId?: string;
  req: Request;
}): Promise<void> {
  try {
    const { deviceType, browser, os } = parseUserAgent(params.req.headers['user-agent']);

    await prisma.loginHistory.create({
      data: {
        userId: params.userId || null,
        userType: params.userType,
        email: params.email,
        loginMethod: params.loginMethod,
        ipAddress: getClientIp(params.req),
        userAgent: params.req.headers['user-agent'] || null,
        deviceType,
        browser,
        os,
        success: params.success,
        failReason: params.failReason || null,
        sessionId: params.sessionId || null,
      },
    });
  } catch (error) {
    console.error('[AuditLogger] Failed to create login history:', error);
  }
}

// Create security alert
export async function createSecurityAlert(params: {
  alertType: 'failed_login' | 'suspicious_activity' | 'rate_limit' | 'ip_blocked';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  description: string;
  metadata?: any;
  req: Request;
}): Promise<void> {
  try {
    await prisma.securityAlert.create({
      data: {
        alertType: params.alertType,
        severity: params.severity,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        ipAddress: getClientIp(params.req),
        description: params.description,
        metadata: params.metadata || null,
      },
    });
  } catch (error) {
    console.error('[AuditLogger] Failed to create security alert:', error);
  }
}

// Create data access log (for PII access)
export async function createDataAccessLog(params: {
  accessorId?: string;
  accessorEmail: string;
  accessorType: 'admin' | 'user' | 'system';
  accessType: 'view' | 'export' | 'download' | 'search';
  dataType: string;
  resourceId?: string;
  fieldsAccessed?: string[];
  purpose?: string;
  req: Request;
}): Promise<void> {
  try {
    await prisma.dataAccessLog.create({
      data: {
        accessorId: params.accessorId || null,
        accessorEmail: params.accessorEmail,
        accessorType: params.accessorType,
        accessType: params.accessType,
        dataType: params.dataType,
        resourceId: params.resourceId || null,
        fieldsAccessed: params.fieldsAccessed || [],
        purpose: params.purpose || null,
        ipAddress: getClientIp(params.req),
      },
    });
  } catch (error) {
    console.error('[AuditLogger] Failed to create data access log:', error);
  }
}

// Middleware for automatic audit logging
export function auditLogMiddleware(options?: {
  excludePaths?: string[];
  excludeMethods?: string[];
}) {
  const excludePaths = options?.excludePaths || ['/health', '/ping'];
  const excludeMethods = options?.excludeMethods || ['OPTIONS'];

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Skip excluded paths and methods
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    if (excludeMethods.includes(req.method)) {
      return next();
    }

    const startTime = Date.now();

    // Store original send function
    const originalSend = res.send;
    let responseBody: any;

    // Override send to capture response
    res.send = function (body): Response {
      responseBody = body;
      return originalSend.call(this, body);
    };

    // Continue with request
    res.on('finish', async () => {
      // Only log if admin is authenticated
      const admin = req.admin;
      if (!admin?.email) return;

      // Calculate duration
      const duration = Date.now() - startTime;

      // Determine action and resource
      const action = ACTION_MAP[req.method] || req.method.toLowerCase();
      const resourceType = getResourceType(req.path);
      const resourceId = extractResourceId(req.path);

      // Only log write operations by default
      if (req.method === 'GET') {
        // Skip GET requests unless it's a sensitive resource
        const sensitiveResources = ['customer', 'payment', 'statistics'];
        if (!sensitiveResources.includes(resourceType)) {
          return;
        }
      }

      // Create audit log
      await createAuditLog({
        adminEmail: admin.email,
        adminId: admin.id,
        action,
        resourceType,
        resourceId,
        description: `${action} ${resourceType}`,
        oldValue: (req as any).auditOldValue || null,
        newValue: req.body || null,
        req,
        statusCode: res.statusCode,
        duration,
      });
    });

    next();
  };
}

export default {
  createAuditLog,
  createLoginHistory,
  createSecurityAlert,
  createDataAccessLog,
  auditLogMiddleware,
};
