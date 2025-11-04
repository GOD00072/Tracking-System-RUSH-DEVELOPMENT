import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface CalculatorSettings {
  exchange_rates: {
    member: number;
    vip: number;
    vvip: number;
  };
  shipping_rates_japan: {
    air: number;
    sea: number;
  };
  courier_rates_thailand: {
    dhl: number;
    best: number;
    lalamove: number;
  };
  additional_services: {
    repack: number;
  };
  company_info: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

// Fetch calculator settings
export const useCalculatorSettings = () => {
  return useQuery<CalculatorSettings>({
    queryKey: ['calculator-settings'],
    queryFn: async () => {
      const response = await api.get('/settings/calculator');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update calculator settings
export const useUpdateCalculatorSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<CalculatorSettings>) => {
      const response = await api.put('/settings/calculator', settings);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['calculator-settings'] });
    },
  });
};
