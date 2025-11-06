import api from '../lib/api';

export interface Review {
  id: string;
  customerId: string | null;
  customerName: string | null;
  customerImage: string | null;
  orderId: string | null;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    companyName: string | null;
    contactPerson: string | null;
  };
  order?: {
    id: string;
    orderNumber: string;
  };
}

export type CreateReviewInput = {
  customerId?: string;
  customerName?: string;
  customerImage?: string;
  orderId?: string;
  rating: number;
  comment?: string;
  isApproved?: boolean;
  isFeatured?: boolean;
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

// Get all reviews
export const getReviews = async (page = 1, limit = 20, approved?: boolean): Promise<PaginatedResponse<Review>> => {
  const params: any = { page, limit };
  if (approved !== undefined) {
    params.approved = approved;
  }
  const response = await api.get('/reviews', { params });
  return response.data;
};

// Get single review
export const getReview = async (id: string): Promise<Review> => {
  const response = await api.get(`/reviews/${id}`);
  return response.data.data;
};

// Create review
export const createReview = async (data: CreateReviewInput): Promise<Review> => {
  const response = await api.post('/reviews', data);
  return response.data.data;
};

// Update review
export const updateReview = async (id: string, data: Partial<CreateReviewInput>): Promise<Review> => {
  const response = await api.patch(`/reviews/${id}`, data);
  return response.data.data;
};

// Delete review
export const deleteReview = async (id: string): Promise<void> => {
  await api.delete(`/reviews/${id}`);
};
