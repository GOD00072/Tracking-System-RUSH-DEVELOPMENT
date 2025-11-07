# Cookie Separation: Admin vs User Authentication

## 🎯 Overview
แยก authentication cookies ระหว่าง Admin (username/password) และ User (LINE OAuth) เพื่อให้ทั้ง 2 ระบบทำงานได้พร้อมกันโดยไม่ชนกัน

## 🍪 Cookie Names

### 1. Admin Cookie
```
Name: admin_token
Usage: Admin login (username/password)
Path: /
HttpOnly: true
MaxAge: 7 days
```

### 2. User Cookie
```
Name: user_token
Usage: LINE login (OAuth)
Path: /
HttpOnly: true
MaxAge: 7 days
```

### 3. Legacy Cookie (Backward Compatibility)
```
Name: token
Usage: Old authentication (still supported)
Path: /
```

## 🔄 Authentication Flow

### Admin Login Flow
```
1. POST /auth/admin/login
   ↓
2. Validate credentials
   ↓
3. Generate JWT token
   ↓
4. Set cookie: admin_token=<jwt>
   ↓
5. Return user data + token
```

### LINE Login Flow
```
1. GET /auth/line
   ↓
2. Redirect to LINE OAuth
   ↓
3. LINE callback → /auth/line/callback
   ↓
4. Generate JWT token
   ↓
5. Set cookie: user_token=<jwt>
   ↓
6. Redirect to frontend
```

## 🔒 Authentication Middleware Priority

```typescript
authenticateToken() checks in order:
1. Authorization: Bearer <token>  (Header)
2. admin_token                     (Cookie)
3. user_token                      (Cookie)
4. token                           (Cookie - legacy)
5. Passport session                (Session)
```

## 📁 Files Modified

### Backend

#### 1. `/backend/src/routes/auth.ts`

**Admin Login:**
```typescript
router.post('/admin/login', async (req, res) => {
  // ... validate credentials ...

  // Set admin-specific cookie
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
});
```

**LINE Callback:**
```typescript
router.get('/line/callback', passport.authenticate('line'), (req, res) => {
  // ... generate token ...

  // Set user-specific cookie
  res.cookie('user_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
});
```

#### 2. `/backend/src/middleware/auth.ts`

```typescript
export const authenticateToken = (req, res, next) => {
  let token = null;

  // Check multiple sources
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token && req.cookies?.admin_token) {
    token = req.cookies.admin_token;  // Admin cookie
  }

  if (!token && req.cookies?.user_token) {
    token = req.cookies.user_token;   // User cookie
  }

  if (!token && req.cookies?.token) {
    token = req.cookies.token;        // Legacy cookie
  }

  // ... verify token ...
};
```

## 🧪 Testing

### Test Admin Login
```bash
# 1. Login as admin
curl -X POST http://localhost:5000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shiptracking.com","password":"admin123"}' \
  -c admin_cookies.txt

# Check cookie
cat admin_cookies.txt | grep admin_token
# ✅ Output: admin_token=<jwt>

# 2. Access admin API
curl http://localhost:5000/api/v1/admin/orders \
  -b admin_cookies.txt

# ✅ Response: All orders (admin access)
```

### Test LINE Login
```bash
# 1. Open browser
http://localhost:5000/auth/line

# 2. After login, check browser cookies
# ✅ Cookie: user_token=<jwt>

# 3. Access user API
curl http://localhost:5000/api/v1/orders \
  -b "user_token=<jwt>"

# ✅ Response: User's orders (filtered)
```

### Test Both Cookies Together
```bash
# Scenario: User has both admin and user sessions

# Set both cookies
curl http://localhost:5000/api/v1/admin/orders \
  -b "admin_token=<admin-jwt>" \
  -b "user_token=<user-jwt>"

# ✅ Uses admin_token (priority)
# ✅ Returns all orders (admin access)
```

## 🎯 Use Cases

### 1. Admin User
```
Browser Cookies:
✅ admin_token=<jwt>

Can access:
- /api/v1/admin/*     (Admin APIs)
- /api/v1/orders      (All orders)
- /api/v1/customers   (All customers)
```

### 2. Regular User (LINE Login)
```
Browser Cookies:
✅ user_token=<jwt>

Can access:
- /api/v1/orders      (Filtered by user)
- /api/v1/reviews     (User's reviews)
- /api/v1/shipments   (User's shipments)
```

### 3. Admin + User (Same Browser)
```
Browser Cookies:
✅ admin_token=<admin-jwt>
✅ user_token=<user-jwt>

Behavior:
- admin_token has priority
- All requests use admin role
- Can access both admin and user APIs
```

## ⚠️ Important Notes

### 1. Cookie Priority
- `admin_token` is checked **before** `user_token`
- If both exist, admin_token wins
- This allows admin to test as both roles

### 2. Logout
**Admin Logout:**
```typescript
router.post('/admin/logout', (req, res) => {
  res.clearCookie('admin_token', { path: '/' });
  // user_token remains (if exists)
});
```

**User Logout:**
```typescript
router.post('/logout', (req, res) => {
  res.clearCookie('user_token', { path: '/' });
  // admin_token remains (if exists)
});
```

### 3. Frontend Integration

**Admin Pages:**
```typescript
// Use admin-specific API endpoints
const api = axios.create({
  baseURL: '/api/v1/admin',
  withCredentials: true,  // Send cookies
});
```

**User Pages:**
```typescript
// Use user API endpoints
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,  // Send cookies
});
```

## 🔐 Security Features

### 1. HttpOnly Flag
```typescript
httpOnly: true  // Prevent JavaScript access
```
- Cookies cannot be read by `document.cookie`
- Protected from XSS attacks

### 2. Secure Flag (Production)
```typescript
secure: process.env.NODE_ENV === 'production'
```
- Only sent over HTTPS in production
- Prevents MITM attacks

### 3. SameSite
```typescript
sameSite: 'lax'
```
- Protects against CSRF attacks
- Allows cookies on top-level navigation

### 4. Path Restriction
```typescript
path: '/'
```
- Cookie sent with all requests
- Consistent behavior across app

## ✅ Benefits

### 1. **No Conflicts**
- Admin and user sessions don't interfere
- Can test both roles simultaneously

### 2. **Clear Separation**
- Easy to identify auth source
- Better debugging and logging

### 3. **Backward Compatible**
- Still supports legacy `token` cookie
- Gradual migration possible

### 4. **Flexible**
- Admin can impersonate user view
- Developer can test both modes

## 🚀 Migration Guide

### From Single Cookie to Separated Cookies

**Before:**
```typescript
// Single cookie for all
res.cookie('token', jwt);
```

**After:**
```typescript
// Admin
res.cookie('admin_token', jwt);

// User
res.cookie('user_token', jwt);
```

**Middleware now checks:**
```typescript
1. admin_token  (Priority)
2. user_token   (Second)
3. token        (Legacy fallback)
```

## 📝 Summary

✅ **Admin Cookie:** `admin_token`
✅ **User Cookie:** `user_token`
✅ **Priority:** admin_token > user_token > token
✅ **No Conflicts:** Both can coexist
✅ **Secure:** HttpOnly, Secure (prod), SameSite
✅ **Flexible:** Supports multiple auth methods

ระบบพร้อมใช้งานแล้ว! 🎉
