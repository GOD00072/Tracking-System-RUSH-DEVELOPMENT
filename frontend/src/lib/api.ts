import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
    if (error.response?.status === 401) {
      // Clear both possible token keys
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      // Don't redirect, just clear token
    }
    return Promise.reject(error);
  }
);

export default api;
