import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../services/customerService';
import { toast } from 'sonner';

type CreateCustomerInput = {
  userId?: string;
  airtableId?: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  lineId?: string;
  address?: string;
  notes?: string;
};

// Get all customers
export const useCustomers = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['customers', page, limit],
    queryFn: () => getCustomers(page, limit),
  });
};

// Get single customer
export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
};

// Create customer mutation
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerInput) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to create customer');
    },
  });
};

// Update customer mutation
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerInput> }) =>
      updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
      toast.success('Customer updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update customer');
    },
  });
};

// Delete customer mutation
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to delete customer');
    },
  });
};
