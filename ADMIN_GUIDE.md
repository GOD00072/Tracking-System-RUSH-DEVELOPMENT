# Admin Panel Guide - Ship Tracking System

## 🔐 การเข้าสู่ระบบ Admin

### URL
```
http://localhost:5001/admin/login
```

### ข้อมูลเข้าสู่ระบบ (Demo)
- **Email**: admin@shiptracking.com
- **Password**: admin123

---

## 📱 หน้าต่างๆ ใน Admin Panel

### 1. Dashboard (`/admin/dashboard`)
- ภาพรวมระบบ
- สถิติสำคัญ (คำสั่งซื้อ, การจัดส่ง, ลูกค้า)
- คำสั่งซื้อล่าสุด
- การดำเนินการด่วน

### 2. Settings (`/admin/settings`)
- **อัตราแลกเปลี่ยน** (¥ → ฿)
  - Member: 0.250
  - VIP: 0.240
  - VVIP: 0.230

- **ค่าขนส่งจากญี่ปุ่น**
  - AIR: ฿700
  - SEA: ฿1,000

- **ค่าจัดส่งในไทย**
  - DHL Express: ฿26
  - BEST Express: ฿35
  - Lalamove: ฿50

- **บริการเสริม**
  - Repack/Bubble: ฿50

- **ข้อมูลบริษัท**
  - ชื่อบริษัท
  - ที่อยู่
  - เบอร์โทรศัพท์
  - อีเมล

### 3. Sidebar Menu
- ✅ Dashboard
- ✅ คำสั่งซื้อ (Orders)
- ✅ การจัดส่ง (Shipments)
- ✅ ตารางเรือ (Schedules)
- ✅ ลูกค้า (Customers)
- ✅ รีวิว (Reviews)
- ✅ ตั้งค่าราคา (Pricing)
- ✅ ข้อความติดต่อ (Messages)
- ✅ สถิติ (Statistics)
- ✅ ตั้งค่าระบบ (Settings)
- ✅ ออกจากระบบ (Logout)

---

## 🎨 Features

### ✅ สร้างแล้ว
1. **Admin Login Page**
   - Form login สวยงาม
   - Demo credentials
   - Authentication check

2. **Admin Layout with Sidebar**
   - Dark theme sidebar
   - Icon menu
   - Active state highlighting
   - Logout button

3. **Dashboard**
   - Stats cards (4 ข้อ)
   - Recent orders list
   - Quick actions

4. **Settings Page**
   - ตั้งค่าอัตราแลกเปลี่ยน
   - ตั้งค่าราคาขนส่ง
   - ตั้งค่าผู้ให้บริการ
   - บันทึกการตั้งค่า

5. **Protected Routes**
   - ตรวจสอบ authentication
   - Redirect ไป login ถ้าไม่ได้ login
   - ตรวจสอบ role เป็น admin

---

## 🧮 Advanced Calculator

### URL
```
http://localhost:5001/calculator
```

### Features
- ✅ เลือกระดับผู้ใช้งาน (Member/VIP/VVIP)
- ✅ ใส่ราคาสินค้า (¥)
- ✅ ระบุน้ำหนัก (KG)
- ✅ เลือกวิธีจัดส่ง (AIR/SEA)
- ✅ เลือกประเภทสินค้า (AIR เท่านั้น)
- ✅ บริการ Repack/Bubble
- ✅ ความยาวสินค้า
- ✅ เลือกผู้ให้บริการในไทย
- ✅ พื้นที่จัดส่ง (DHL)
- ✅ ขนาดกล่อง (กว้าง x ยาว x สูง)

### Summary Box (Real-time)
- ค่าสินค้า
- ค่าขนส่งจากญี่ปุ่น
- ค่า Repack (ถ้ามี)
- ค่าจัดส่งในไทย
- **รวมทั้งหมด**

---

## 🗄️ Database Schema

### Calculator Settings Table
```sql
CREATE TABLE calculator_settings (
  id UUID PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Settings Keys
- `exchange_rates` - อัตราแลกเปลี่ยน
- `shipping_rates_japan` - ค่าขนส่งจากญี่ปุ่น
- `courier_rates_thailand` - ค่าขนส่งในไทย
- `additional_services` - บริการเสริม
- `product_category_rates` - อัตราตามประเภทสินค้า
- `dhl_area_rates` - ค่า DHL ตามพื้นที่
- `weight_tiers` - อัตราตามน้ำหนัก
- `volume_weight_config` - การคำนวณน้ำหนักปริมาตร
- `company_info` - ข้อมูลบริษัท

📄 ดูรายละเอียดเพิ่มเติม: `/docs/database/CALCULATOR_SCHEMA.md`

---

## 🔒 Security

### Authentication Flow
1. User เข้า `/admin` หรือ `/admin/*` (ยกเว้น `/admin/login`)
2. ระบบตรวจสอบ `isAuthenticated` และ `user.role === 'admin'`
3. ถ้าไม่ผ่าน → Redirect ไป `/admin/login`
4. ถ้าผ่าน → แสดง Admin Panel พร้อม Sidebar

### State Management
- ใช้ **Zustand** + **Persist** เก็บ auth state
- เก็บใน localStorage
- Auto restore เมื่อ refresh page

---

## 🎯 Next Steps

### ที่ต้องทำต่อ
1. **เชื่อมต่อ Backend API**
   - GET /api/v1/calculator/settings
   - PUT /api/v1/calculator/settings/:key
   - POST /api/v1/calculator/calculate-advanced

2. **Admin Pages อื่นๆ**
   - Orders Management
   - Shipments Tracking
   - Customers List
   - Reviews Management
   - Messages Inbox

3. **Database Integration**
   - สร้าง `calculator_settings` table
   - Insert default data
   - Create API endpoints

4. **Real Authentication**
   - เชื่อมต่อ Supabase Auth
   - JWT token management
   - Refresh token

---

## 📞 Support

**Contact**:
- binamon2006@gmail.com
- c_somsit@hotmail.com

**สร้างเมื่อ**: November 2, 2025
