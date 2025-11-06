# Cookie Separation Implementation - Complete

## Problem
Admin login was failing with 403 errors because cookies were conflicting between regular users and admin sessions.

## Solution Implemented

### 1. Backend Changes

#### Created Separate Admin Authentication Middleware
- **File**: `backend/src/middleware/auth.ts`
- **New function**: `authenticateAdmin()`
  - Only checks `admin_token` cookie (not `user_token`)
  - Verifies that the token has `role: 'admin'`
  - Returns 403 if non-admin tries to access

#### Updated Admin Routes
- **File**: `backend/src/routes/admin/orders.ts`
- Removed the `requireAdmin` middleware (redundant)
- Changed all routes to use `authenticateAdmin` instead of `authenticateToken + requireAdmin`
- Now all admin endpoints only accept admin tokens

#### Cookie Separation in Auth Routes
- **File**: `backend/src/routes/auth.ts`

**Admin Login** (`POST /auth/admin/login`):
```javascript
// Clears user cookies before setting admin cookie
res.clearCookie('user_token', { path: '/' });
res.clearCookie('token', { path: '/' });
res.cookie('admin_token', token, { ... });
```

**LINE Login** (`GET /auth/line/callback`):
```javascript
// Clears admin cookies before setting user cookie
res.clearCookie('admin_token', { path: '/' });
res.cookie('user_token', token, { ... });
```

### 2. Cookie Strategy

| Session Type | Cookie Name | Used By |
|-------------|-------------|---------|
| Admin | `admin_token` | Admin panel routes (`/api/v1/admin/*`) |
| Regular User | `user_token` | Customer routes (LINE login users) |
| Legacy | `token` | Backward compatibility (cleared on new login) |

### 3. Middleware Hierarchy

```
authenticateToken (general)
├─ Checks: Authorization header → admin_token → user_token → token
├─ Used by: Regular customer endpoints
└─ Accepts: Any valid JWT token

authenticateAdmin (admin-only)
├─ Checks: Authorization header → admin_token ONLY
├─ Verifies: role === 'admin'
└─ Used by: All /api/v1/admin/* endpoints
```

### 4. Frontend Changes

#### Updated API Interceptor
- **File**: `frontend/src/lib/api.ts`
- **Problem**: Frontend was sending Authorization header with old token for admin routes
- **Solution**:
  - Admin routes (`/admin/*`) now use cookies ONLY (no Authorization header)
  - Non-admin routes continue to use Bearer token from localStorage
  - Checks both `access_token` and `token` keys for backward compatibility

```javascript
// Don't send Authorization header for admin routes
const isAdminRoute = config.url?.includes('/admin/');
if (!isAdminRoute) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
}
```

### 5. Testing

**Test Admin Login:**
1. Clear browser cookies and localStorage
2. Go to `/admin/login`
3. Login with: `admin@shiptracking.com` / `admin123`
4. Should redirect to `/admin/dashboard`
5. Admin orders should now load correctly (no more 403 errors)

**Test User Login:**
1. Use LINE login on main site
2. Should clear any admin cookies
3. User can access their own orders

## Files Modified

### Backend:
1. `backend/src/middleware/auth.ts` - Added `authenticateAdmin()` middleware
2. `backend/src/routes/admin/orders.ts` - Use `authenticateAdmin` instead of `authenticateToken + requireAdmin`
3. `backend/src/routes/auth.ts` - Clear conflicting cookies on login/logout

### Frontend:
4. `frontend/src/lib/api.ts` - Skip Authorization header for admin routes

## Root Cause

The 403 error was caused by:
1. Admin login created `admin_token` cookie
2. But frontend also sent old `user_token` in Authorization header
3. `authenticateToken` middleware prioritized Authorization header over cookies
4. So it used the wrong token → role check failed → 403

## Notes

- Admin routes now use cookies exclusively
- Regular user routes use Bearer tokens
- `withCredentials: true` ensures cookies are sent automatically
- The separation ensures admin and regular user sessions don't interfere
