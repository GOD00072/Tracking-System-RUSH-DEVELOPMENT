import api from '../lib/api';
import { Shipment, TrackingHistory } from './orderService';

// Get all shipments
export const getShipments = async () => {
  const response = await api.get('/shipments');
  return response.data;
};

// Get shipment by tracking number
export const getShipmentByTracking = async (trackingNumber: string): Promise<Shipment> => {
  const response = await api.get(`/shipments/tracking/${trackingNumber}`);
  return response.data.data;
};

// Get tracking history
export const getTrackingHistory = async (shipmentId: string): Promise<TrackingHistory[]> => {
  const response = await api.get(`/shipments/${shipmentId}/history`);
  return response.data.data;
};
