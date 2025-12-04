import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Use VITE_BACKEND_URL for auth routes (no /api/v1 prefix)
const AUTH_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user, token) => {
        localStorage.setItem('access_token', token);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        // Clear local storage first
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth-storage');

        // Clear session storage
        sessionStorage.clear();

        // Update state
        set({ user: null, isAuthenticated: false });

        // Call backend to clear cookie (fire and forget)
        // Note: auth routes are at /auth, not /api/v1/auth
        fetch(`${AUTH_URL}/auth/admin/logout`, {
          method: 'POST',
          credentials: 'include',
        }).catch((error) => {
          console.error('Logout API error:', error);
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
