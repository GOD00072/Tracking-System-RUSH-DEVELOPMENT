# Frontend-Backend Integration Guide

## 🎉 สำเร็จแล้ว! Frontend เชื่อมต่อกับ Backend แล้ว

---

## 📦 สิ่งที่เพิ่มเข้ามา

### 1. **API Services** (`frontend/src/services/`)
- ✅ `orderService.ts` - Order CRUD operations
- ✅ `shipmentService.ts` - Shipment tracking
- ✅ `scheduleService.ts` - Schedule management
- ✅ `statisticsService.ts` - Statistics data

### 2. **React Query Hooks** (`frontend/src/hooks/`)
- ✅ `useOrders.ts` - Hooks for orders (CRUD + caching)
  - `useOrders()` - Get all orders with pagination
  - `useOrder(id)` - Get single order
  - `useCreateOrder()` - Create order mutation
  - `useUpdateOrder()` - Update order mutation
  - `useDeleteOrder()` - Delete order mutation

### 3. **Updated Pages**
- ✅ `ShipTrackingPage.tsx` - ใช้ API จริงแสดงรายการ orders
  - แสดงรายการ orders ทั้งหมดจาก database
  - ค้นหาด้วย order number
  - แสดงรายละเอียดสินค้า พร้อม shipments

---

## 🌐 API Endpoints ที่ใช้งาน

### Orders API
```typescript
GET    /api/v1/orders           // Get all orders (with pagination)
GET    /api/v1/orders/:id       // Get order by ID
POST   /api/v1/orders           // Create new order
PATCH  /api/v1/orders/:id       // Update order
DELETE /api/v1/orders/:id       // Delete order
```

### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

---

## 🔧 วิธีใช้งาน API ใน Components

### Example 1: แสดงรายการ Orders
```typescript
import { useOrders } from '../hooks/useOrders';

function OrderList() {
  const { data, isLoading, error } = useOrders(1, 20);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading orders</div>;

  return (
    <div>
      {data?.data.map(order => (
        <div key={order.id}>{order.orderNumber}</div>
      ))}
    </div>
  );
}
```

### Example 2: สร้าง Order ใหม่
```typescript
import { useCreateOrder } from '../hooks/useOrders';

function CreateOrderForm() {
  const createOrder = useCreateOrder();

  const handleSubmit = () => {
    createOrder.mutate({
      orderNumber: 'ORD-001',
      shippingMethod: 'sea',
      origin: 'China',
      destination: 'Thailand'
    });
  };

  return <button onClick={handleSubmit}>Create Order</button>;
}
```

### Example 3: อัพเดท Order
```typescript
import { useUpdateOrder } from '../hooks/useOrders';

function UpdateOrderButton({ orderId }) {
  const updateOrder = useUpdateOrder();

  const handleUpdate = () => {
    updateOrder.mutate({
      id: orderId,
      data: { status: 'shipped' }
    });
  };

  return <button onClick={handleUpdate}>Mark as Shipped</button>;
}
```

---

## 📂 โครงสร้างไฟล์ที่เพิ่ม

```
frontend/
├── src/
│   ├── services/          # API service functions
│   │   ├── orderService.ts
│   │   ├── shipmentService.ts
│   │   ├── scheduleService.ts
│   │   └── statisticsService.ts
│   │
│   ├── hooks/            # React Query hooks
│   │   └── useOrders.ts
│   │
│   └── pages/
│       └── ShipTracking/
│           └── ShipTrackingPage.tsx  # ✅ Updated!
```

---

## 🧪 ทดสอบการทำงาน

### 1. ทดสอบ ShipTrackingPage
1. เปิด browser: http://localhost:5002/ship-tracking
2. จะเห็นรายการ orders จาก database
3. ลองค้นหาด้วย "TEST-001" (order ที่เราสร้างไว้)

### 2. ทดสอบสร้าง Order ผ่าน API
```bash
# Terminal
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "TEST-002",
    "shippingMethod": "air",
    "origin": "Japan",
    "destination": "Thailand"
  }'
```

จากนั้นรีเฟรช ShipTrackingPage จะเห็น order ใหม่ทันที!

---

## 🔄 React Query Features

### Automatic Caching
- Data ถูก cache อัตโนมัติ
- ไม่ต้องเรียก API ซ้ำถ้ามีข้อมูลใน cache

### Auto Refetch
- Refetch เมื่อ window focus กลับมา
- Refetch เมื่อ network reconnect

### Optimistic Updates
- UI update ทันทีก่อน API response
- Auto rollback ถ้า API error

### Mutations with Invalidation
- หลังจาก create/update/delete
- จะ invalidate queries อัตโนมัติ
- Data จะ refetch ให้ใหม่

---

## 🎯 Pages ที่พร้อมเชื่อมต่อ API

### ✅ เสร็จแล้ว:
- [x] ShipTrackingPage - แสดง orders และ search

### 📝 รอเชื่อมต่อ:
- [ ] HomePage - สถิติแบบเรียลไทม์
- [ ] SchedulePage - ตารางเรือ/เครื่องบิน
- [ ] CalculatorPage - คำนวณค่าขนส่ง
- [ ] StatisticsPage - สถิติและกราฟ
- [ ] Admin Dashboard - จัดการข้อมูล

---

## 🚀 Next Steps

### 1. เพิ่ม Toast Notifications
```bash
# Already installed: react-hot-toast
```
Toast จะแสดงอัตโนมัติเมื่อ:
- ✅ Create/Update/Delete success
- ❌ API errors

### 2. เพิ่ม Loading States
ใช้ `LoadingSpinner` component ที่มีอยู่แล้ว

### 3. Error Handling
ใช้ React Query's error handling:
```typescript
const { data, isLoading, error } = useOrders();

if (error) {
  // Handle error
  return <ErrorMessage error={error} />;
}
```

### 4. Pagination
```typescript
const [page, setPage] = useState(1);
const { data } = useOrders(page, 20);

// data.pagination มี: page, limit, total, total_pages
```

---

## 💡 Tips

### 1. Type Safety
ทุก API มี TypeScript types แล้ว:
```typescript
import { Order, Shipment, TrackingHistory } from '../services/orderService';
```

### 2. Auto-completion
IDE จะ autocomplete ได้ทุกอย่าง:
- API methods
- Response structure
- Request payload

### 3. Error Messages
Error messages จะแสดงจาก backend อัตโนมัติ:
```typescript
error?.response?.data?.error?.message
```

---

## 🔗 Related Files

- Backend API: `backend/src/routes/orders.ts`
- Backend Schema: `backend/prisma/schema.prisma`
- Frontend API Client: `frontend/src/lib/api.ts`
- Query Client Setup: `frontend/src/lib/queryClient.ts`

---

## 📞 Testing Checklist

- [x] Backend API running (Port 5000)
- [x] Frontend running (Port 5002)
- [x] Database connected
- [x] CORS configured
- [x] API calls working
- [x] Data displayed in UI
- [x] Loading states working
- [x] Error handling working

---

**Last Updated**: November 4, 2025
**Status**: ✅ Integration Complete!
