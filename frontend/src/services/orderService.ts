import api from '../lib/api';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  shippingMethod: 'sea' | 'air';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  origin: string | null;
  destination: string | null;
  totalWeight: number | null;
  totalVolume: number | null;
  estimatedCost: number | null;
  actualCost: number | null;
  estimatedDelivery: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    companyName: string | null;
    contactPerson: string | null;
    phone: string | null;
  };
  shipments?: Shipment[];
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  currentStatus: string | null;
  currentLocation: string | null;
  carrier: string | null;
  vesselName: string | null;
  flightNumber: string | null;
  departurePort: string | null;
  arrivalPort: string | null;
  departureDate: string | null;
  arrivalDate: string | null;
  latitude: number | null;
  longitude: number | null;
  trackingHistory?: TrackingHistory[];
}

export interface TrackingHistory {
  id: string;
  status: string;
  location: string | null;
  description: string | null;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
}

export type CreateOrderInput = {
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

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Get all orders
export const getOrders = async (page = 1, limit = 20): Promise<PaginatedResponse<Order>> => {
  const response = await api.get('/orders', {
    params: { page, limit },
  });
  return response.data;
};

// Get single order
export const getOrder = async (id: string): Promise<Order> => {
  const response = await api.get(`/orders/${id}`);
  return response.data.data;
};

// Create order
export const createOrder = async (data: CreateOrderInput): Promise<Order> => {
  const response = await api.post('/orders', data);
  return response.data.data;
};

// Update order
export const updateOrder = async (id: string, data: Partial<CreateOrderInput>): Promise<Order> => {
  const response = await api.patch(`/orders/${id}`, data);
  return response.data.data;
};

// Delete order
export const deleteOrder = async (id: string): Promise<void> => {
  await api.delete(`/orders/${id}`);
};
