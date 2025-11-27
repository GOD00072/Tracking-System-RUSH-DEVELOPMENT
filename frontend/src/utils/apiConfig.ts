// API Configuration - reads from .env.development or .env.production
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export default API_BASE_URL;
