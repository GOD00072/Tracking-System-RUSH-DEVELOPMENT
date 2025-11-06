import api from '../lib/api';

export interface Schedule {
  id: string;
  scheduleType: 'sea' | 'air';
  carrier: string | null;
  vesselName: string | null;
  flightNumber: string | null;
  route: string | null;
  departurePort: string | null;
  arrivalPort: string | null;
  departureDate: string | null;
  arrivalDate: string | null;
  frequency: string | null;
  status: 'active' | 'cancelled' | 'delayed';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Get all schedules
export const getSchedules = async (type?: 'sea' | 'air') => {
  const response = await api.get('/schedules', {
    params: { type },
  });
  return response.data;
};

// Get schedule by ID
export const getSchedule = async (id: string): Promise<Schedule> => {
  const response = await api.get(`/schedules/${id}`);
  return response.data.data;
};
