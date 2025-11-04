# NPM Packages List - Ship Tracking System

## Frontend Packages (Next.js)

### Core Framework
```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "typescript": "^5.4.0"
}
```

### Styling & UI
```json
{
  "tailwindcss": "^3.4.0",
  "@tailwindcss/forms": "^0.5.7",
  "autoprefixer": "^10.4.19",
  "postcss": "^8.4.38",
  "lucide-react": "^0.367.0",
  "framer-motion": "^11.0.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0"
}
```

### shadcn/ui Components (via CLI)
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add select
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
```

### Forms & Validation
```json
{
  "react-hook-form": "^7.51.0",
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.0"
}
```

### State Management & Data Fetching
```json
{
  "@tanstack/react-query": "^5.28.0",
  "zustand": "^4.5.0",
  "axios": "^1.6.0"
}
```

### Maps & Location
```json
{
  "react-leaflet": "^4.2.1",
  "leaflet": "^1.9.4"
}
```

### Charts & Visualization
```json
{
  "recharts": "^2.12.0"
}
```

### Date & Time
```json
{
  "date-fns": "^3.3.0",
  "react-datepicker": "^6.3.0"
}
```

### Notifications
```json
{
  "sonner": "^1.4.0"
}
```

### Authentication
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@react-oauth/google": "^0.12.0"
}
```

### Utilities
```json
{
  "lodash": "^4.17.21",
  "nanoid": "^5.0.6",
  "react-dropzone": "^14.2.0",
  "swiper": "^11.0.0"
}
```

### Development Tools
```json
{
  "@types/node": "^20.11.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "@types/leaflet": "^1.9.0",
  "@types/lodash": "^4.14.0",
  "eslint": "^8.57.0",
  "eslint-config-next": "^14.2.0",
  "prettier": "^3.2.0",
  "prettier-plugin-tailwindcss": "^0.5.0"
}
```

---

## Backend Packages (Node.js + Express)

### Core Framework
```json
{
  "express": "^4.18.0",
  "typescript": "^5.4.0",
  "ts-node": "^10.9.0",
  "tsx": "^4.7.0",
  "nodemon": "^3.1.0"
}
```

### Database & Authentication
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "pg": "^8.11.0",
  "dotenv": "^16.4.0"
}
```

### API & Integrations
```json
{
  "axios": "^1.6.0",
  "@line/bot-sdk": "^9.0.0",
  "airtable": "^0.12.0"
}
```

### Validation & Security
```json
{
  "zod": "^3.22.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.1.0",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0"
}
```

### Utilities
```json
{
  "lodash": "^4.17.21",
  "date-fns": "^3.3.0",
  "winston": "^3.11.0",
  "morgan": "^1.10.0"
}
```

### Development Tools
```json
{
  "@types/express": "^4.17.0",
  "@types/node": "^20.11.0",
  "@types/cors": "^2.8.0",
  "@types/bcrypt": "^5.0.0",
  "@types/jsonwebtoken": "^9.0.0",
  "@typescript-eslint/eslint-plugin": "^7.0.0",
  "@typescript-eslint/parser": "^7.0.0",
  "eslint": "^8.57.0",
  "prettier": "^3.2.0"
}
```

---

## Installation Commands

### Frontend Setup
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
npm install @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers
npm install react-leaflet leaflet recharts date-fns react-datepicker sonner
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @react-oauth/google
npm install lucide-react framer-motion clsx tailwind-merge
npm install lodash nanoid react-dropzone swiper
npm install -D @types/leaflet @types/lodash prettier prettier-plugin-tailwindcss
```

### Backend Setup
```bash
cd backend
npm init -y
npm install express typescript ts-node tsx nodemon
npm install @supabase/supabase-js pg dotenv
npm install axios @line/bot-sdk airtable
npm install zod helmet cors express-rate-limit bcrypt jsonwebtoken
npm install lodash date-fns winston morgan
npm install -D @types/express @types/node @types/cors @types/bcrypt @types/jsonwebtoken
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint prettier
```

---

## Package.json Scripts

### Frontend (Next.js)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\""
  }
}
```

### Backend (Express)
```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write \"src/**/*.{ts,js,json}\""
  }
}
```

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_LINE_LIFF_ID=
```

### Backend (.env)
```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# LINE OA
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=

# Airtable
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=

# FlowAccount
FLOWACCOUNT_API_KEY=
FLOWACCOUNT_SECRET_KEY=

# JWT
JWT_SECRET=

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

**Last Updated**: November 2, 2025
