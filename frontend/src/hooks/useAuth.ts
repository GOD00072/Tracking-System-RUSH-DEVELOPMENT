import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, logout, setToken } from '../services/authService';
import { toast } from 'sonner';
import { useEffect } from 'react';

// Get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      toast.success('Logged out successfully');
      window.location.href = '/';
    },
    onError: () => {
      // Clear local data even if API call fails
      localStorage.removeItem('token');
      queryClient.clear();
      window.location.href = '/';
    },
  });
};

// Hook to handle LINE callback token
export const useLineCallback = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const loginStatus = params.get('login');

    if (loginStatus === 'success' && token) {
      setToken(token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Successfully logged in with LINE!');

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (loginStatus === 'failed') {
      toast.error('Failed to login with LINE. Please try again.');

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient]);
};
