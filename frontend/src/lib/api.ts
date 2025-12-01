import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
// Server URL without /api/v1 - for static files like images
export const SERVER_URL = API_BASE_URL.replace('/api/v1', '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Don't send Authorization header for admin routes - they use cookies only
    const isAdminRoute = config.url?.includes('/admin/');

    if (!isAdminRoute) {
      // For non-admin routes, try to get token from localStorage
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || '';
    const errorCode = error.response?.data?.error?.code || '';

    // ตรวจจับ Admin authentication required หรือ 401/403 errors
    if (status === 401 || status === 403) {
      const isAdminAuthError =
        errorMessage.includes('Admin authentication required') ||
        errorMessage.includes('Invalid or expired token') ||
        errorCode === 'ADMIN_REQUIRED' ||
        errorCode === 'INVALID_TOKEN' ||
        errorCode === 'TOKEN_EXPIRED' ||
        errorCode === 'UNAUTHORIZED';

      // Clear all tokens
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('admin_token');

      // ถ้าเป็น admin page และ authentication error - redirect ไป login
      const isAdminPage = window.location.pathname.startsWith('/admin');
      if (isAdminPage && isAdminAuthError) {
        // Clear cookies via document.cookie (for httpOnly cookies, server must clear)
        document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Redirect to login
        window.location.href = '/admin/login?expired=true';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
