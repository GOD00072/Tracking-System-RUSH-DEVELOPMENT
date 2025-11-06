import api from '../lib/api';

export interface User {
  id: string;
  email: string | null;
  fullName: string | null;
  lineId: string | null;
  profilePicture: string | null;
  role: string;
  createdAt: string;
  customer?: {
    id: string;
    companyName: string | null;
    contactPerson: string | null;
    phone: string | null;
    address: string | null;
  } | null;
}

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  // Use axios directly for /auth endpoints (not under /api/v1)
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  const data = await response.json();
  return data.data;
};

// Logout
export const logout = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  await fetch('http://localhost:5000/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  localStorage.removeItem('token');
};

// Store token
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Get token
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};
