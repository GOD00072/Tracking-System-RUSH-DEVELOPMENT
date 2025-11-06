# Admin API Separation

## 🎯 Overview
แยก API endpoints สำหรับ Admin ออกจาก User API เพื่อให้ Admin เห็นข้อมูลทั้งหมดโดยไม่ต้อง filter ตาม user

## 📋 API Endpoints Comparison

### User API (Original)
```
GET  /api/v1/orders       - ดู orders (filtered by user)
POST /api/v1/orders       - สร้าง order
PATCH /api/v1/orders/:id  - อัปเดต order
DELETE /api/v1/orders/:id - ลบ order
```

**Behavior:**
- ✅ ต้องใช้ authentication
- ✅ User ทั่วไป: เห็นเฉพาะ orders ที่ match phone/LINE ID
- ✅ Admin: เห็นทุก orders

### Admin API (New)
```
GET  /api/v1/admin/orders       - ดู orders ทั้งหมด (Admin only)
GET  /api/v1/admin/orders/:id   - ดู order details
POST /api/v1/admin/orders       - สร้าง order
PATCH /api/v1/admin/orders/:id  - อัปเดต order
DELETE /api/v1/admin/orders/:id - ลบ order
```

**Behavior:**
- ✅ ต้องใช้ authentication
- ✅ ต้องเป็น Admin role เท่านั้น (HTTP 403 ถ้าไม่ใช่)
- ✅ ไม่มี filter - เห็นทุก orders ในระบบ
- ✅ รองรับ search และ filter by status

## 🔧 Implementation

### Backend

#### 1. Admin Routes File
**`backend/src/routes/admin/orders.ts`**

```typescript
import express from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req: AuthRequest, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.userId },
    select: { role: true },
  });

  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }

  next();
};

// All routes use: authenticateToken, requireAdmin
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  // No filtering - return all orders
  const orders = await prisma.order.findMany({
    // ... get all orders
  });
});
```

#### 2. Register Admin Routes
**`backend/src/index.ts`**

```typescript
// Admin Routes
import adminOrdersRouter from './routes/admin/orders';

// Register
app.use('/api/v1/admin/orders', adminOrdersRouter);
```

### Frontend

#### 1. Admin Hooks
**`frontend/src/hooks/useAdminOrders.ts`**

```typescript
import api from '../lib/api';

const ADMIN_ORDERS_ENDPOINT = '/admin/orders';

export const useAdminOrders = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['admin-orders', page, limit],
    queryFn: async () => {
      const response = await api.get(`${ADMIN_ORDERS_ENDPOINT}?page=${page}&limit=${limit}`);
      return response.data;
    },
  });
};

export const useAdminCreateOrder = () => {
  // ...
};
```

#### 2. Update Admin Pages
**`frontend/src/pages/Admin/AdminOrdersPage.tsx`**

```typescript
// Before
import { useOrders, useCreateOrder, ... } from '../../hooks/useOrders';

// After
import { useAdminOrders, useAdminCreateOrder, ... } from '../../hooks/useAdminOrders';

// Usage
const { data: ordersData, isLoading } = useAdminOrders(1, 50);
```

## 🔒 Security Features

### 1. **Authentication Required**
```typescript
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  // Must have valid JWT token
});
```

### 2. **Admin Role Check**
```typescript
const requireAdmin = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.userId },
    select: { role: true },
  });

  if (user.role !== 'admin') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }

  next();
};
```

### 3. **Error Responses**

**No Token:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No token provided"
  }
}
```

**Not Admin:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required"
  }
}
```

## 🎨 Features

### 1. **Search Support**
```bash
GET /api/v1/admin/orders?search=BKK
```
ค้นหาจาก:
- Order number
- Origin
- Destination
- Customer company name
- Customer contact person

### 2. **Status Filter**
```bash
GET /api/v1/admin/orders?status=pending
```
Filter โดย order status

### 3. **Pagination**
```bash
GET /api/v1/admin/orders?page=2&limit=20
```

Response:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### 4. **Auto-generate Order Number**
```bash
POST /api/v1/admin/orders
{
  "customerId": "uuid",
  "shippingMethod": "sea"
  // orderNumber ไม่ต้องส่ง - ระบบสร้างให้
}
```

Response:
```json
{
  "success": true,
  "data": {
    "orderNumber": "20251104-ORD-007",  ← Auto-generated
    ...
  }
}
```

## 🧪 Testing

### Test Admin Access

```bash
# 1. Login as Admin
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# Get token from response
export TOKEN="eyJhbGc..."

# 2. Get All Orders (Admin)
curl http://localhost:5000/api/v1/admin/orders \
  -H "Authorization: Bearer $TOKEN"

# Expected: See ALL orders (no filtering)
```

### Test Non-Admin Access

```bash
# 1. Login as regular user
export USER_TOKEN="eyJhbGc..."

# 2. Try to access admin endpoint
curl http://localhost:5000/api/v1/admin/orders \
  -H "Authorization: Bearer $USER_TOKEN"

# Expected: HTTP 403 Forbidden
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required"
  }
}
```

### Test Auto-generate Order Number

```bash
# Create order without order number
curl -X POST http://localhost:5000/api/v1/admin/orders \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "uuid-here",
    "shippingMethod": "sea",
    "origin": "Bangkok",
    "destination": "Shanghai"
  }'

# Expected:
# {
#   "data": {
#     "orderNumber": "20251104-ORD-001",  ← Auto-generated
#     ...
#   }
# }
```

## 📁 Files Created/Modified

### Backend
- ✅ `backend/src/routes/admin/orders.ts` (New)
- ✅ `backend/src/index.ts` (Modified - register admin routes)

### Frontend
- ✅ `frontend/src/hooks/useAdminOrders.ts` (New)
- ✅ `frontend/src/pages/Admin/AdminOrdersPage.tsx` (Modified - use admin hooks)

## ✅ Checklist

- [x] Create admin routes file
- [x] Implement requireAdmin middleware
- [x] Register admin routes in main server
- [x] Create admin hooks for frontend
- [x] Update AdminOrdersPage to use admin API
- [x] Test authentication
- [x] Test admin role check
- [x] Test search & filter
- [x] Test auto-generate order number

## 🚀 Next Steps

### Extend to Other Resources

Apply the same pattern to other resources:

1. **Admin Customers**
   - `backend/src/routes/admin/customers.ts`
   - `frontend/src/hooks/useAdminCustomers.ts`

2. **Admin Reviews**
   - `backend/src/routes/admin/reviews.ts`
   - `frontend/src/hooks/useAdminReviews.ts`

3. **Admin Shipments**
   - `backend/src/routes/admin/shipments.ts`
   - `frontend/src/hooks/useAdminShipments.ts`

### Additional Features

- [ ] Admin dashboard statistics
- [ ] Bulk operations (delete, update status)
- [ ] Export to CSV/Excel
- [ ] Advanced filtering (date range, multiple statuses)
- [ ] Audit log for admin actions

## 📝 Notes

- ✅ Admin API ไม่มีการ filter ตาม user - เห็นทุก orders
- ✅ User API ยังคงทำงานเดิม - filter ตาม phone/LINE ID
- ✅ Auto-generate order number: `YYYYMMDD-ORD-XXX`
- ✅ Middleware `requireAdmin` ป้องกันการเข้าถึงโดย non-admin
- ✅ Frontend แยก hooks ชัดเจน: `useOrders` vs `useAdminOrders`
