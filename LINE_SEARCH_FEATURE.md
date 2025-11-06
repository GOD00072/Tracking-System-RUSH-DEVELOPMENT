# LINE User Search Feature

## 🎯 Overview
ฟีเจอร์สำหรับค้นหาและเลือกผู้ใช้ที่เคย login ผ่าน LINE Official Account (LINE OA) เพื่อเชื่อมโยงกับข้อมูลลูกค้า

### ✨ Features
- 🔍 **Real-time Search** - ค้นหาอัตโนมัติขณะพิมพ์ (debounced 300ms)
- 🖼️ **Profile Pictures** - แสดงรูปโปรไฟล์จาก LINE OA
- ⚡ **Fast & Responsive** - ผลลัพธ์แสดงทันทีหลังพิมพ์
- 📊 **Result Counter** - นับจำนวนผู้ใช้ที่พบ
- 🎨 **Beautiful UI** - ออกแบบสวยงาม responsive

## 📁 Files Changed/Created

### Backend
- **`backend/src/routes/customers.ts`** (Line 6-87)
  - เพิ่ม GET endpoint: `/api/v1/customers/search-line-users`
  - ค้นหาผู้ใช้จาก `users` table ที่มี `line_id` ไม่เป็น null
  - รองรับการค้นหาจาก: fullName, email, lineId, phone

### Frontend
- **`frontend/src/components/LineSearchModal.tsx`** (New File)
  - Reusable modal component สำหรับค้นหา LINE users
  - รองรับการค้นหาแบบ real-time
  - แสดง loading state และผลลัพธ์การค้นหา

- **`frontend/src/pages/Admin/AdminCustomersPage.tsx`**
  - เพิ่มปุ่ม "ค้นหา" ข้างช่อง LINE ID
  - Auto-fill ข้อมูลเมื่อเลือกผู้ใช้จาก LINE OA

## 🔧 API Endpoint

### GET `/api/v1/customers/search-line-users`

**Query Parameters:**
- `query` (string) - คำค้นหา (ชื่อ, อีเมล, LINE ID, เบอร์โทร)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "phone": "0812345678",
      "lineId": "U1234567890abcdef",
      "profilePicture": "https://profile.line-scdn.net/...",
      "avatarUrl": "https://lh3.googleusercontent.com/...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:5000/api/v1/customers/search-line-users?query=john"
```

## 💻 Component Usage

### LineSearchModal Component

```tsx
import LineSearchModal from '../../components/LineSearchModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  const handleSelectUser = (user) => {
    console.log('Selected user:', user);
    // user.id - User UUID
    // user.lineId - LINE User ID
    // user.fullName - ชื่อผู้ใช้
    // user.email - อีเมล
    // user.phone - เบอร์โทร
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Search LINE Users
      </button>

      <LineSearchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelectUser={handleSelectUser}
      />
    </>
  );
}
```

## 🎨 UI/UX Features

### 1. **Real-time Search (Auto-search)**
   - ไม่ต้องกดปุ่มค้นหา - พิมพ์แล้วรอ 300ms
   - Debounce เพื่อลดการเรียก API
   - แสดง loading spinner ขณะค้นหา

### 2. **Profile Display**
   - แสดงรูปโปรไฟล์จาก `profilePicture` (LINE) หรือ `avatarUrl` (Google)
   - Fallback เป็นไอคอนผู้ใช้สีเขียว
   - รูปโปรไฟล์ขนาด 48x48px, rounded-full

### 3. **Search Capabilities**
   - ค้นหาจากชื่อ, อีเมล, LINE ID, หรือเบอร์โทร
   - Case-insensitive search
   - Partial match support
   - นับจำนวนผลลัพธ์

### 4. **Empty States**
   - Initial state: "เริ่มค้นหาผู้ใช้ LINE"
   - No results: "ไม่พบผู้ใช้ LINE ที่ตรงกับ..."
   - Loading state: Spinner animation

### 5. **Auto-fill Data**
   - เมื่อเลือกผู้ใช้จะ auto-fill:
     - LINE ID
     - User ID (UUID)
     - Company Name (ถ้ายังไม่มี)
     - Contact Person (ถ้ายังไม่มี)

## 🔍 How It Works

1. ผู้ใช้กดปุ่ม "ค้นหา" (สีเขียว) ข้างช่อง LINE ID
2. Modal เปิดขึ้นมา พร้อม auto-focus ที่ช่องค้นหา
3. **พิมพ์คำค้นหา** (ชื่อ, อีเมล, LINE ID, เบอร์โทร)
4. **ผลลัพธ์แสดงอัตโนมัติ** หลังพิมพ์หยุด 300ms
5. ระบบค้นหาจาก database (users table) แบบ real-time
6. แสดงรายการผู้ใช้พร้อม **รูปโปรไฟล์**
7. เห็นจำนวนผู้ใช้ที่พบ (เช่น "พบ 3 ผู้ใช้")
8. คลิกเลือกผู้ใช้
9. ข้อมูลจะถูก auto-fill ในฟอร์ม
10. Modal ปิดอัตโนมัติ

## 📊 Database Schema

ใช้ `User` model จาก Prisma schema:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  fullName  String?  @map("full_name")
  phone     String?
  lineId    String?  @unique @map("line_id")  // ← LINE User ID
  // ...
}
```

**Note:** ระบบจะค้นหาเฉพาะ users ที่ `lineId IS NOT NULL`

## 🐛 Troubleshooting

### Error: "<!doctype..." is not valid JSON

**สาเหตุ:** Field name ไม่ตรงกับ database schema

**แก้ไข:** ตรวจสอบว่าใน schema ใช้ชื่อ field `lineId` (mapped to `line_id`)

### Empty Results

**สาเหตุ:** ไม่มีผู้ใช้ที่เคย login ผ่าน LINE OA ในระบบ

**แก้ไข:**
1. ตรวจสอบว่า LINE Login ทำงานถูกต้อง
2. ผู้ใช้ต้อง login ผ่าน LINE OA อย่างน้อย 1 ครั้ง
3. ตรวจสอบ database: `SELECT * FROM users WHERE line_id IS NOT NULL;`

## 🚀 Testing

### 1. Test API Endpoint
```bash
# Check backend health
curl http://localhost:5000/health

# Test search endpoint
curl "http://localhost:5000/api/v1/customers/search-line-users?query=test"

# Expected response:
# {"success":true,"data":[]}  (if no LINE users exist)
```

### 2. Test Frontend
1. เปิด Admin > Customers
2. กด "Add Customer" หรือ "Edit"
3. กดปุ่ม "ค้นหา" ข้างช่อง LINE ID
4. ทดสอบค้นหาด้วยคำต่างๆ

## ✅ Checklist

- [x] Backend API endpoint created
- [x] Frontend modal component created
- [x] Integration with AdminCustomersPage
- [x] Error handling
- [x] Loading states
- [x] Empty states
- [x] Auto-fill functionality
- [x] Fixed field name issue (lineUserId → lineId)
- [x] **Real-time search with debounce (300ms)**
- [x] **Profile picture display**
- [x] **Result counter**
- [x] **Auto-focus on search input**
- [x] **Improved UI/UX with better empty states**

## 📝 Notes

- ฟีเจอร์นี้ต้องการให้ผู้ใช้เคย login ผ่าน LINE OA มาก่อน
- LINE User ID จะถูกเก็บใน `users.line_id` field
- Component สามารถนำไปใช้ในหน้าอื่นๆ ได้ (reusable)
