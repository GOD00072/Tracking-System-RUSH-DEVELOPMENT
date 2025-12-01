import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All audit routes require admin authentication
router.use(authenticateAdmin);

// GET /api/v1/audit/logs - Get admin audit logs with filtering
router.get('/logs', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Filters
    const action = req.query.action as string;
    const resourceType = req.query.resourceType as string;
    const adminEmail = req.query.adminEmail as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {};

    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (adminEmail) where.adminEmail = { contains: adminEmail, mode: 'insensitive' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch audit logs' },
    });
  }
});

// GET /api/v1/audit/logs/:id - Get single audit log detail
router.get('/logs/:id', async (req: AuthRequest, res) => {
  try {
    const log = await prisma.adminAuditLog.findUnique({
      where: { id: req.params.id },
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Audit log not found' },
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch audit log' },
    });
  }
});

// GET /api/v1/audit/login-history - Get login history
router.get('/login-history', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Filters
    const userType = req.query.userType as string;
    const email = req.query.email as string;
    const success = req.query.success as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {};

    if (userType) where.userType = userType;
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (success !== undefined) where.success = success === 'true';
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [history, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loginHistory.count({ where }),
    ]);

    res.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch login history' },
    });
  }
});

// GET /api/v1/audit/security-alerts - Get security alerts
router.get('/security-alerts', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Filters
    const alertType = req.query.alertType as string;
    const severity = req.query.severity as string;
    const isResolved = req.query.isResolved as string;

    const where: any = {};

    if (alertType) where.alertType = alertType;
    if (severity) where.severity = severity;
    if (isResolved !== undefined) where.isResolved = isResolved === 'true';

    const [alerts, total] = await Promise.all([
      prisma.securityAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.securityAlert.count({ where }),
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch security alerts' },
    });
  }
});

// PATCH /api/v1/audit/security-alerts/:id/resolve - Resolve security alert
router.patch('/security-alerts/:id/resolve', async (req: AuthRequest, res) => {
  try {
    const { notes } = req.body;
    const adminEmail = req.admin?.email || 'unknown';

    const alert = await prisma.securityAlert.update({
      where: { id: req.params.id },
      data: {
        isResolved: true,
        resolvedBy: adminEmail,
        resolvedAt: new Date(),
        resolvedNotes: notes || null,
      },
    });

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Error resolving security alert:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to resolve security alert' },
    });
  }
});

// GET /api/v1/audit/data-access - Get data access logs
router.get('/data-access', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Filters
    const accessorEmail = req.query.accessorEmail as string;
    const dataType = req.query.dataType as string;
    const accessType = req.query.accessType as string;

    const where: any = {};

    if (accessorEmail) where.accessorEmail = { contains: accessorEmail, mode: 'insensitive' };
    if (dataType) where.dataType = dataType;
    if (accessType) where.accessType = accessType;

    const [logs, total] = await Promise.all([
      prisma.dataAccessLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dataAccessLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching data access logs:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch data access logs' },
    });
  }
});

// GET /api/v1/audit/stats - Get audit statistics
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const [
      totalAuditLogs,
      todayAuditLogs,
      totalLogins,
      todayLogins,
      failedLogins,
      unresolvedAlerts,
      criticalAlerts,
    ] = await Promise.all([
      prisma.adminAuditLog.count(),
      prisma.adminAuditLog.count({ where: { createdAt: { gte: today } } }),
      prisma.loginHistory.count(),
      prisma.loginHistory.count({ where: { createdAt: { gte: today } } }),
      prisma.loginHistory.count({ where: { success: false, createdAt: { gte: thisWeek } } }),
      prisma.securityAlert.count({ where: { isResolved: false } }),
      prisma.securityAlert.count({ where: { severity: 'critical', isResolved: false } }),
    ]);

    // Get top actions this week
    const topActions = await prisma.adminAuditLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: thisWeek } },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 5,
    });

    // Get active admins this week
    const activeAdmins = await prisma.adminAuditLog.groupBy({
      by: ['adminEmail'],
      where: { createdAt: { gte: thisWeek } },
      _count: { adminEmail: true },
      orderBy: { _count: { adminEmail: 'desc' } },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalAuditLogs,
          todayAuditLogs,
          totalLogins,
          todayLogins,
          failedLoginsThisWeek: failedLogins,
          unresolvedAlerts,
          criticalAlerts,
        },
        topActions: topActions.map(a => ({ action: a.action, count: a._count.action })),
        activeAdmins: activeAdmins.map(a => ({ email: a.adminEmail, count: a._count.adminEmail })),
      },
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch audit stats' },
    });
  }
});

// GET /api/v1/audit/export - Export audit logs (CSV)
router.get('/export', async (req: AuthRequest, res) => {
  try {
    const type = req.query.type as string || 'audit'; // audit, login, security
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let data: any[] = [];
    let filename = '';

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    switch (type) {
      case 'login':
        data = await prisma.loginHistory.findMany({
          where: startDate || endDate ? { createdAt: dateFilter } : {},
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        filename = 'login_history.csv';
        break;
      case 'security':
        data = await prisma.securityAlert.findMany({
          where: startDate || endDate ? { createdAt: dateFilter } : {},
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        filename = 'security_alerts.csv';
        break;
      default:
        data = await prisma.adminAuditLog.findMany({
          where: startDate || endDate ? { createdAt: dateFilter } : {},
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        filename = 'audit_logs.csv';
    }

    // Convert to CSV
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_DATA', message: 'No data to export' },
      });
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => {
      return Object.values(row).map(val => {
        if (val === null) return '';
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(',');
    }).join('\n');

    const csv = `${headers}\n${rows}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit data:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_ERROR', message: 'Failed to export data' },
    });
  }
});

export default router;
