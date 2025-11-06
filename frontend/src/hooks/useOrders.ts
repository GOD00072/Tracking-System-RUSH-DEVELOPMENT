import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../services/orderService';
import { toast } from 'sonner';

// Define input type locally to avoid import issues
type CreateOrderInput = {
  orderNumber: string;
  customerId?: string;
  shippingMethod: 'sea' | 'air';
  status?: string;
  origin?: string;
  destination?: string;
  totalWeight?: number;
  totalVolume?: number;
  estimatedCost?: number;
  estimatedDelivery?: string;
  notes?: string;
};

// Get all orders
export const useOrders = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['orders', page, limit],
    queryFn: () => getOrders(page, limit),
  });
};

// Get single order
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
};

// Create order mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderInput) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to create order');
    },
  });
};

// Update order mutation
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateOrderInput> }) =>
      updateOrder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.id] });
      toast.success('Order updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update order');
    },
  });
};

// Delete order mutation
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to delete order');
    },
  });
};
