import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} from '../services/reviewService';
import { toast } from 'sonner';

type CreateReviewInput = {
  customerId?: string;
  customerName?: string;
  customerImage?: string;
  orderId?: string;
  rating: number;
  comment?: string;
  isApproved?: boolean;
  isFeatured?: boolean;
};

// Get all reviews
export const useReviews = (page = 1, limit = 20, approved?: boolean) => {
  return useQuery({
    queryKey: ['reviews', page, limit, approved],
    queryFn: () => getReviews(page, limit, approved),
  });
};

// Get single review
export const useReview = (id: string) => {
  return useQuery({
    queryKey: ['reviews', id],
    queryFn: () => getReview(id),
    enabled: !!id,
  });
};

// Create review mutation
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewInput) => createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to create review');
    },
  });
};

// Update review mutation
export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateReviewInput> }) =>
      updateReview(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.id] });
      toast.success('Review updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update review');
    },
  });
};

// Delete review mutation
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to delete review');
    },
  });
};
