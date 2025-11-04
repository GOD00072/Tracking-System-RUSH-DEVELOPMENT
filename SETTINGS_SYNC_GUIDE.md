# Settings Sync Guide - Admin ↔ Calculator

## 🎯 ระบบทำงาน

### Flow การทำงาน
```
1. Admin เปิด /admin/settings
   ↓
2. Frontend ดึงค่าจาก GET /api/v1/settings/calculator
   ↓
3. แสดงค่าในฟอร์ม
   ↓
4. Admin แก้ไขค่า
   ↓
5. กดบันทึก → PUT /api/v1/settings/calculator
   ↓
6. Backend บันทึกค่าใหม่
   ↓
7. Frontend invalidate React Query cache
   ↓
8. Calculator page จะได้ค่าใหม่ทันที!
```

---

## 🔧 Backend API

### GET /api/v1/settings/calculator
ดึงค่าการตั้งค่าทั้งหมด

**Response**:
```json
{
  "success": true,
  "data": {
    "exchange_rates": {
      "member": 0.250,
      "vip": 0.240,
      "vvip": 0.230
    },
    "shipping_rates_japan": {
      "air": 700,
      "sea": 1000
    },
    "courier_rates_thailand": {
      "dhl": 26,
      "best": 35,
      "lalamove": 50
    },
    "additional_services": {
      "repack": 50
    },
    "company_info": {
      "name": "Ship Tracking Company",
      "address": "กรุงเทพมหานคร ประเทศไทย",
      "phone": "02-XXX-XXXX",
      "email": "info@shiptracking.com"
    }
  }
}
```

### PUT /api/v1/settings/calculator
อัพเดทค่าการตั้งค่า (ทั้งหมดหรือบางส่วน)

**Request**:
```json
{
  "exchange_rates": {
    "member": 0.245,
    "vip": 0.235,
    "vvip": 0.225
  },
  "shipping_rates_japan": {
    "air": 750,
    "sea": 1050
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Settings updated successfully"
}
```

---

## ⚛️ Frontend Hook

### useCalculatorSettings()
ดึงค่าการตั้งค่า (auto cache 5 minutes)

```typescript
import { useCalculatorSettings } from '../../hooks/useCalculatorSettings';

const { data: settings, isLoading } = useCalculatorSettings();

// ใช้งาน
const exchangeRate = settings?.exchange_rates.member || 0.250;
```

### useUpdateCalculatorSettings()
อัพเดทค่าการตั้งค่า (auto invalidate cache)

```typescript
import { useUpdateCalculatorSettings } from '../../hooks/useCalculatorSettings';

const updateSettings = useUpdateCalculatorSettings();

const handleSave = async () => {
  await updateSettings.mutateAsync({
    exchange_rates: {
      member: 0.245,
      vip: 0.235,
      vvip: 0.225,
    },
  });
};
```

---

## 📱 การใช้งาน

### Admin Settings Page (`/admin/settings`)

**Features**:
1. ✅ โหลดค่าจาก API อัตโนมัติ
2. ✅ แสดง loading state ขณะโหลด
3. ✅ แก้ไขค่าได้ทันที
4. ✅ บันทึกค่าไปยัง backend
5. ✅ แสดง toast notification เมื่อบันทึกสำเร็จ
6. ✅ Auto update cache หลังบันทึก

**ค่าที่แก้ไขได้**:
- อัตราแลกเปลี่ยน (Member/VIP/VVIP)
- ค่าขนส่งจากญี่ปุ่น (AIR/SEA)
- ค่าจัดส่งในไทย (DHL/BEST/Lalamove)
- ค่าบริการเสริม (Repack)
- ข้อมูลบริษัท

### Calculator Page (`/calculator`)

**Features**:
1. ✅ โหลดค่าจาก API อัตโนมัติ
2. ✅ คำนวณตามค่าล่าสุดที่ Admin ตั้งไว้
3. ✅ Fallback values ถ้า API ล้ม
4. ✅ Auto refetch เมื่อ Admin บันทึกค่าใหม่
5. ✅ แสดง loading state ขณะโหลด

**ค่าที่ใช้จาก Settings**:
- Exchange rate ตาม user level
- Shipping rates (AIR/SEA)
- Courier rates (DHL/BEST/Lalamove)
- Repack service fee

---

## 🧪 ทดสอบระบบ

### ขั้นตอนทดสอบ:

1. **เปิด Calculator** (`http://localhost:5001/calculator`)
   - สังเกตราคาเริ่มต้น เช่น DHL = ฿26

2. **Login Admin** (`http://localhost:5001/admin/login`)
   - Email: `admin@shiptracking.com`
   - Password: `admin123`

3. **ไป Settings** (`/admin/settings`)
   - เปลี่ยนค่า DHL จาก 26 → 30
   - กดบันทึก
   - เห็น toast "บันทึกการตั้งค่าสำเร็จ"

4. **กลับไป Calculator** (`/calculator`)
   - รีเฟรชหน้า (หรือไม่ต้อง - cache จะ invalidate อัตโนมัติ)
   - ตอนนี้ DHL เป็น ฿30 แล้ว! ✅

5. **ทดสอบ API ด้วย curl**:
   ```bash
   # ดึงค่าปัจจุบัน
   curl http://localhost:5000/api/v1/settings/calculator

   # อัพเดทค่า
   curl -X PUT http://localhost:5000/api/v1/settings/calculator \
     -H "Content-Type: application/json" \
     -d '{"exchange_rates":{"member":0.245,"vip":0.235,"vvip":0.225}}'
   ```

---

## 🔄 React Query Cache

### Auto Invalidation
เมื่อ Admin บันทึกค่าใหม่:
1. `updateSettings.mutateAsync()` ถูกเรียก
2. Backend บันทึกค่า
3. `onSuccess` ทำงาน → `queryClient.invalidateQueries(['calculator-settings'])`
4. React Query refetch ข้อมูลใหม่
5. Calculator page ได้ค่าใหม่ทันที

### Stale Time
- Cache ถูกตั้งค่า stale time = 5 minutes
- หลัง 5 นาที จะ refetch อัตโนมัติ
- Admin update → invalidate ทันที (ไม่รอ 5 นาที)

---

## 📦 Files ที่สร้าง/แก้ไข

### Backend
- ✅ `/backend/src/routes/settings.ts` - Settings API routes
- ✅ `/backend/src/index.ts` - เพิ่ม settings router

### Frontend
- ✅ `/frontend/src/hooks/useCalculatorSettings.ts` - Custom hook
- ✅ `/frontend/src/pages/Admin/AdminSettingsPage.tsx` - ใช้ hook + บันทึกได้จริง
- ✅ `/frontend/src/pages/Calculator/CalculatorPage.tsx` - ใช้ค่าจาก API

---

## 🎯 Benefits

### ✅ Real-time Sync
- Admin เปลี่ยนค่า → Calculator อัพเดททันที
- ไม่ต้อง redeploy code เพื่อเปลี่ยนราคา

### ✅ Centralized Settings
- จัดการราคาได้ที่เดียว
- ไม่มี hardcode แล้ว

### ✅ Cache Efficiency
- React Query cache ลด API calls
- Auto refetch เมื่อจำเป็น

### ✅ Fallback Values
- ถ้า API ล้ม → ใช้ค่า default
- ระบบไม่พัง

### ✅ Type Safety
- TypeScript interface สำหรับ settings
- Autocomplete + Type checking

---

## 🚀 Next Steps

### เพิ่มเติมในอนาคต:
1. **Database Integration**
   - ย้ายจาก in-memory → PostgreSQL
   - ใช้ `calculator_settings` table

2. **Audit Log**
   - บันทึกว่าใครเปลี่ยนค่าอะไรเมื่อไหร่
   - `updated_by` + `updated_at`

3. **Validation**
   - Zod schema สำหรับ validation
   - ป้องกันค่าติดลบหรือไม่สมเหตุสมผล

4. **Version Control**
   - เก็บประวัติการเปลี่ยนแปลง
   - Rollback ได้

5. **Real-time Push**
   - WebSocket สำหรับ push ค่าใหม่
   - ไม่ต้องรอ refetch

---

**สร้างเมื่อ**: November 2, 2025
**Status**: ✅ ใช้งานได้แล้ว!
