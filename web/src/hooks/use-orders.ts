import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from '../lib/api';
import type {
  MyReview,
  OrderDetail,
  OrderStatus,
  OrderSummary,
  Paginated,
  PaymentMethod,
  ReviewableItem,
} from '../lib/types';

export interface CheckoutInput {
  paymentMethod: PaymentMethod;
  cardNumber?: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  notes?: string;
}

export function useOrders(page = 1, status?: OrderStatus) {
  return useQuery({
    queryKey: ['orders', { page, status }],
    queryFn: () => api.get<Paginated<OrderSummary>>(`/orders${qs({ page, status })}`),
    placeholderData: (previous) => previous,
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<{ order: OrderDetail }>(`/orders/${id}`),
    select: (data) => data.order,
    enabled: Number.isFinite(id),
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) =>
      api.post<{ orderId: number; totalPrice: number }>('/orders', input),
    onSuccess: () => {
      // Checkout empties the cart and moves stock, so all three caches are stale.
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['product'], exact: false });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) =>
      api.post<{ orderId: number; status: OrderStatus }>(`/orders/${orderId}/cancel`),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['product'], exact: false });
    },
  });
}

export function useReviewableItems() {
  return useQuery({
    queryKey: ['orders', 'reviewable'],
    queryFn: () => api.get<{ items: ReviewableItem[] }>('/orders/reviewable'),
    select: (data) => data.items,
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: ['reviews', 'mine'],
    queryFn: () => api.get<{ reviews: MyReview[] }>('/reviews/mine'),
    select: (data) => data.reviews,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      orderId: number;
      variantId: number;
      rating: number;
      body: string;
    }) => api.post('/reviews', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'reviewable'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['product'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['order'], exact: false });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => api.delete<void>(`/reviews/${reviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'reviewable'] });
      queryClient.invalidateQueries({ queryKey: ['product'], exact: false });
    },
  });
}
