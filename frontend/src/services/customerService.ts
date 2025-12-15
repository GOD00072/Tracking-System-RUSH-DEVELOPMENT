import api from '../lib/api';

export interface Customer {
  id: string;
  customerCode: string | null;
  userId: string | null;
  airtableId: string | null;
  companyName: string | null;
  contactPerson: string | null;
  phone: string | null;
  lineId: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string | null;
  };
  orders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
  }>;
}

export type CreateCustomerInput = {
  userId?: string;
  airtableId?: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  lineId?: string;
  address?: string;
  notes?: string;
  email?: string;
  tier?: string;
  discount?: number;
  profileImageUrl?: string;
  taxId?: string;
  shippingAddress?: string;
  billingAddress?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: string;
  preferredContact?: string;
  referralSource?: string;
  tags?: string[];
  isActive?: boolean;
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

// Get all customers with optional search and filters
export const getCustomers = async (
  page = 1,
  limit = 20,
  search?: string,
  filters?: { tier?: string; status?: string; hasLine?: string }
): Promise<PaginatedResponse<Customer>> => {
  const params: any = { page, limit };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (filters?.tier) {
    params.tier = filters.tier;
  }
  if (filters?.status) {
    // Send 'true' or 'false' as string
    params.isActive = filters.status === 'active' ? 'true' : 'false';
  }
  if (filters?.hasLine) {
    // Send 'true' or 'false' as string
    params.hasLine = filters.hasLine === 'yes' ? 'true' : 'false';
  }
  const response = await api.get('/customers', { params });
  return response.data;
};

// Get customer statistics
export const getCustomerStats = async (): Promise<{
  totalCustomers: number;
  newThisMonth: number;
  vipCount: number;
  activeCount: number;
}> => {
  const response = await api.get('/customers/stats');
  return response.data.data;
};

// Get single customer
export const getCustomer = async (id: string): Promise<Customer> => {
  const response = await api.get(`/customers/${id}`);
  return response.data.data;
};

// Create customer
export const createCustomer = async (data: CreateCustomerInput): Promise<Customer> => {
  const response = await api.post('/customers', data);
  return response.data.data;
};

// Update customer
export const updateCustomer = async (id: string, data: Partial<CreateCustomerInput>): Promise<Customer> => {
  const response = await api.patch(`/customers/${id}`, data);
  return response.data.data;
};

// Delete customer
export const deleteCustomer = async (id: string): Promise<void> => {
  await api.delete(`/customers/${id}`);
};
