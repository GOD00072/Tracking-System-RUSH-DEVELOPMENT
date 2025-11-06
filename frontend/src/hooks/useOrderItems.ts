import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { toast } from 'sonner';

export type OrderItem = {
  id: string;
  orderId: string;
  sequenceNumber?: number;
  clickDate?: string;
  clickChannel?: string;
  clickerName?: string;
  customerName?: string;
  productCode?: string;
  productUrl?: string;
  priceYen?: number;
  priceBaht?: number;
  itemStatus?: string;
  paymentStatus?: string;
  shippingRound?: string;
  trackingNumber?: string;
  storePage?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
};

type CreateOrderItemInput = Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateOrderItemInput = Partial<Omit<OrderItem, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>>;

// Get order items for a specific order
export const useOrderItems = (orderId?: string) => {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (orderId) params.append('orderId', orderId);

      const response = await api.get(`/order-items?${params.toString()}`);
      return response.data;
    },
    enabled: !!orderId,
  });
};

// Get all order items with pagination
export const useOrderItemsList = (page = 1, limit = 50, filters?: {
  orderId?: string;
  customerId?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['order-items-list', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters?.orderId) params.append('orderId', filters.orderId);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.search) params.append('search', filters.search);

      const response = await api.get(`/order-items?${params.toString()}`);
      return response.data;
    },
  });
};

// Get single order item
export const useOrderItem = (id: string) => {
  return useQuery({
    queryKey: ['order-items', id],
    queryFn: async () => {
      const response = await api.get(`/order-items/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create order item
export const useCreateOrderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderItemInput) => {
      const response = await api.post('/order-items', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-items', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-items-list'] });
      toast.success('เพิ่มรายการสินค้าสำเร็จ');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า';
      toast.error(message);
    },
  });
};

// Update order item
export const useUpdateOrderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrderItemInput }) => {
      const response = await api.patch(`/order-items/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const orderId = data.data?.orderId;
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ['order-items', orderId] });
      }
      queryClient.invalidateQueries({ queryKey: ['order-items-list'] });
      toast.success('อัปเดตรายการสินค้าสำเร็จ');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'เกิดข้อผิดพลาดในการอัปเดตรายการสินค้า';
      toast.error(message);
    },
  });
};

// Delete order item
export const useDeleteOrderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/order-items/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-items'] });
      queryClient.invalidateQueries({ queryKey: ['order-items-list'] });
      toast.success('ลบรายการสินค้าสำเร็จ');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'เกิดข้อผิดพลาดในการลบรายการสินค้า';
      toast.error(message);
    },
  });
};

// Bulk create order items
export const useBulkCreateOrderItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, items }: { orderId: string; items: Partial<OrderItem>[] }) => {
      const response = await api.post('/order-items/bulk', { orderId, items });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-items', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-items-list'] });
      toast.success(`เพิ่ม ${data.data?.length || 0} รายการสินค้าสำเร็จ`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า';
      toast.error(message);
    },
  });
};
