import api from '../lib/api';

export interface Statistics {
  totalOrders: number;
  activeShipments: number;
  deliveredOrders: number;
  revenue: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
  }>;
}

// Get statistics
export const getStatistics = async (): Promise<Statistics> => {
  const response = await api.get('/statistics');
  return response.data.data;
};

// Get statistics by date range
export const getStatisticsByDateRange = async (startDate: string, endDate: string) => {
  const response = await api.get('/statistics/range', {
    params: { startDate, endDate },
  });
  return response.data.data;
};
