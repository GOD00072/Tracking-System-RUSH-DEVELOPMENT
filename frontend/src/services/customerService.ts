import api from '../lib/api';

export interface Customer {
  id: string;
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

// Get all customers
export const getCustomers = async (page = 1, limit = 20): Promise<PaginatedResponse<Customer>> => {
  const response = await api.get('/customers', { params: { page, limit } });
  return response.data;
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
