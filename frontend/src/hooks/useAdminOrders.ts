import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { toast } from 'sonner';

// Admin orders API endpoints
const ADMIN_ORDERS_ENDPOINT = '/admin/orders';

type CreateOrderInput = {
  orderNumber?: string;
  customerId?: string;
  shippingMethod: string;
  status?: string;
  origin?: string;
  destination?: string;
  totalWeight?: number;
  totalVolume?: number;
  estimatedCost?: number;
  actualCost?: number;
  estimatedDelivery?: string;
  notes?: string;
};

type OrderFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  shippingMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  tracking?: string;
};

// Get all orders (Admin only - with filtering)
export const useAdminOrders = (filters: OrderFilters = {}) => {
  const { page = 1, limit = 50, search, status, shippingMethod, dateFrom, dateTo, tracking } = filters;

  return useQuery({
    queryKey: ['admin-orders', page, limit, search, status, shippingMethod, dateFrom, dateTo, tracking],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (shippingMethod) params.append('shippingMethod', shippingMethod);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (tracking) params.append('tracking', tracking);

      const response = await api.get(`${ADMIN_ORDERS_ENDPOINT}?${params.toString()}`);
      return response.data;
    },
  });
};

// Get single order
export const useAdminOrder = (id: string) => {
  return useQuery({
    queryKey: ['admin-orders', id],
    queryFn: async () => {
      const response = await api.get(`${ADMIN_ORDERS_ENDPOINT}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create order mutation
export const useAdminCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const response = await api.post(ADMIN_ORDERS_ENDPOINT, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order created successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to create order';
      toast.error(message);
    },
  });
};

// Update order mutation
export const useAdminUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateOrderInput> }) => {
      const response = await api.patch(`${ADMIN_ORDERS_ENDPOINT}/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders', variables.id] });
      toast.success('Order updated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to update order';
      toast.error(message);
    },
  });
};

// Delete order mutation
export const useAdminDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`${ADMIN_ORDERS_ENDPOINT}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order deleted successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to delete order';
      toast.error(message);
    },
  });
};
