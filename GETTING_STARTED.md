# Getting Started - Ship Tracking System

## ✅ โครงสร้างโปรเจคที่สร้างเสร็จแล้ว

```
Tracking System (RUSH DEVELOPMENT)/
├── frontend/                 # React + Vite + TypeScript (Port 5001)
├── backend/                  # Node.js + Express (Port 5000)
├── docs/                     # เอกสารและ documentation
│   ├── database/            # Database schema
│   ├── api/                 # API documentation
│   ├── wireframes/          # (ว่าง - รอ wireframe)
│   ├── WEEK1_PLAN.md
│   ├── PACKAGES.md
│   ├── PROJECT_STATUS.md
│   └── CUSTOMER_COMMUNICATION_TEMPLATE.md
└── README.md
```

---

## 🚀 การรันโปรเจค

### Backend (Port 5000)

```bash
cd backend
npm run dev
```

เซิร์ฟเวอร์จะทำงานที่: **http://localhost:5000**

**API Endpoints ที่พร้อมใช้งาน:**
- `GET /health` - Health check
- `GET /api/v1/orders` - รายการ orders
- `GET /api/v1/shipments/track/:tracking_number` - ติดตามพัสดุ
- `POST /api/v1/calculator/calculate` - คำนวณค่าขนส่ง
- `GET /api/v1/statistics/dashboard` - สถิติ dashboard
- `POST /api/v1/contact` - ส่งฟอร์มติดต่อ

### Frontend (Port 5001)

```bash
cd frontend
npm run dev
```

เว็บไซต์จะทำงานที่: **http://localhost:5001**

---

## 📄 หน้าเว็บทั้ง 11 หน้าที่พร้อมใช้งาน

| หน้า | เส้นทาง | สถานะ | คำอธิบาย |
|------|---------|-------|----------|
| 1. Home | `/` | ✅ สมบูรณ์ | หน้าแรก พร้อม Hero section, Features, Stats |
| 2. Process | `/process` | 🔧 พื้นฐาน | อธิบายขั้นตอนการใช้งาน |
| 3. Ship Tracking | `/ship-tracking` | ✅ สมบูรณ์ | ฟอร์มติดตามสินค้าทางเรือ |
| 4. Air Tracking | `/air-tracking` | ✅ สมบูรณ์ | ฟอร์มติดตามสินค้าทางอากาศ |
| 5. Schedule | `/schedule` | 🔧 พื้นฐาน | ตารางรอบเรือและเครื่องบิน |
| 6. Calculator | `/calculator` | ✅ สมบูรณ์ | คำนวณค่าขนส่ง (เชื่อมต่อ API แล้ว) |
| 7. Portfolio | `/portfolio` | 🔧 พื้นฐาน | แสดงผลงาน |
| 8. Review | `/review` | 🔧 พื้นฐาน | รีวิวจากลูกค้า |
| 9. Statistics | `/statistics` | 🔧 พื้นฐาน | สถิติย้อนหลัง |
| 10. About | `/about` | 🔧 พื้นฐาน | เกี่ยวกับบริษัท |
| 11. Contact | `/contact` | 🔧 พื้นฐาน | ฟอร์มติดต่อ |

---

## 🎨 Technology Stack ที่ติดตั้งแล้ว

### Frontend
- ✅ React 18 + TypeScript
- ✅ Vite
- ✅ Tailwind CSS + Custom Theme
- ✅ React Router DOM v6
- ✅ TanStack Query (React Query)
- ✅ Zustand (State Management)
- ✅ React Hook Form + Zod
- ✅ Axios
- ✅ Lucide React (Icons)
- ✅ Framer Motion
- ✅ React Leaflet (Maps)
- ✅ Recharts (Charts)
- ✅ Sonner (Toast Notifications)
- ✅ Date-fns
- ✅ Lodash

### Backend
- ✅ Node.js + Express
- ✅ TypeScript
- ✅ Helmet (Security)
- ✅ CORS
- ✅ Morgan (Logging)
- ✅ Express Rate Limit
- ✅ Dotenv
- ✅ Supabase Client (พร้อมใช้)
- ✅ LINE Bot SDK (พร้อมใช้)
- ✅ Airtable (พร้อมใช้)
- ✅ Axios
- ✅ Zod
- ✅ bcrypt + JWT
- ✅ Winston (Logger)
- ✅ Date-fns
- ✅ Lodash

---

## ⚙️ Configuration Files

### Frontend Environment (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_CLIENT_ID=
```

### Backend Environment (.env)
```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5001,http://localhost:3000

# To be configured:
# - SUPABASE_URL, SUPABASE_SERVICE_KEY
# - LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN
# - AIRTABLE_API_KEY, AIRTABLE_BASE_ID
# - FLOWACCOUNT_API_KEY, FLOWACCOUNT_SECRET_KEY
# - JWT_SECRET
```

---

## 🎯 สิ่งที่ทำเสร็จแล้ว (Week 1 - Day 1)

- ✅ สร้างโครงสร้างโปรเจค (Frontend + Backend)
- ✅ ติดตั้ง packages ทั้งหมดที่จำเป็น
- ✅ Setup Tailwind CSS พร้อม custom theme
- ✅ สร้าง Navigation + Footer
- ✅ สร้างทั้ง 11 หน้าพร้อม routing
- ✅ Setup Express API server พร้อม 7 routes
- ✅ Configuration files (.env, tsconfig, vite.config)
- ✅ API Client setup (axios with interceptors)
- ✅ State management (Zustand)
- ✅ React Query setup
- ✅ Documentation (Database Schema, API Docs, Week Plan)

---

## 📋 งานต่อไป (Next Steps)

### ด่วน - ต้องทำก่อน
1. **รับข้อมูลจากลูกค้า**
   - Logo (SVG, PNG)
   - Brand Colors (หากต้องการเปลี่ยนจากที่ตั้งไว้)
   - ข้อมูลตัวอย่างลูกค้า
   - API Credentials (LINE OA, FlowAccount, Airtable)

2. **Setup Supabase**
   - สร้าง project บน Supabase
   - สร้าง database tables ตาม schema ใน `docs/database/SCHEMA.md`
   - Setup Authentication
   - เพิ่ม credentials ใน .env

3. **Wireframes/UI Design**
   - ออกแบบหน้าที่ยังไม่สมบูรณ์
   - Review กับลูกค้า

### Week 1 (Nov 2-8)
- [ ] Complete UI/UX design
- [ ] Setup Supabase & Database
- [ ] Implement authentication
- [ ] Connect Airtable
- [ ] Setup LINE OA
- [ ] Deploy to staging (Vercel + Render)

### Week 2-3 (Nov 9-22)
- [ ] Develop core features
- [ ] Implement tracking with real-time maps
- [ ] Complete all 11 pages
- [ ] LINE notifications
- [ ] FlowAccount integration

### Week 4 (Nov 23-29)
- [ ] Testing & Bug fixes
- [ ] Performance optimization
- [ ] Mobile responsive check
- [ ] Customer UAT

### Week 5 (Nov 30 - Dec 2)
- [ ] Production deployment
- [ ] User training
- [ ] Handover

---

## 🛠️ Commands Reference

### Development
```bash
# Frontend
cd frontend
npm run dev              # รัน dev server (Port 5001)
npm run build            # Build production
npm run preview          # Preview production build

# Backend
cd backend
npm run dev              # รัน dev server (Port 5000)
npm run build            # Compile TypeScript
npm start                # รัน production (compiled)
```

### Code Quality
```bash
# Frontend
npm run lint             # Check code quality
npm run format           # Format code

# Backend
npm run lint             # Check code quality
npm run format           # Format code
```

---

## 🌐 Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Frontend (หน้าบ้าน) | **5001** | http://localhost:5001 |
| Backend (หลังบ้าน) | **5000** | http://localhost:5000 |

---

## 🎨 Color Palette

```css
Primary Blue:
- 50:  #E6F2FF
- 500: #0066CC (main)
- 900: #001429

Secondary Orange:
- 50:  #FFE9E3
- 500: #FF6B35 (main)
- 900: #331107

Accent Yellow:
- 50:  #FFF9E6
- 500: #FFD23F (main)
- 900: #332A0D
```

---

## 📞 Contact & Support

- **Email**: binamon2006@gmail.com, c_somsit@hotmail.com
- **Project Timeline**: Nov 2 - Dec 2, 2025 (30 days)
- **Daily Standup**: 09:30 AM

---

## 📚 Additional Documentation

- `/docs/WEEK1_PLAN.md` - แผนสัปดาห์ที่ 1 แบบละเอียด
- `/docs/database/SCHEMA.md` - Database schema ครบทุก table
- `/docs/api/API_DOCUMENTATION.md` - API documentation ทั้งหมด
- `/docs/PACKAGES.md` - รายการ packages ที่ติดตั้ง
- `/docs/PROJECT_STATUS.md` - สถานะโปรเจคแบบ realtime
- `/docs/CUSTOMER_COMMUNICATION_TEMPLATE.md` - Template การติดต่อลูกค้า

---

**สร้างเมื่อ**: November 2, 2025
**สถานะ**: 🟢 พร้อมพัฒนาต่อ
**Progress**: 15% (Week 1 Setup Complete)
