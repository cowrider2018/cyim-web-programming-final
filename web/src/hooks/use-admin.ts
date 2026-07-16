import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from '../lib/api';
import type {
  AdminOrderSummary,
  AdminProduct,
  DashboardStats,
  OrderStatus,
  Paginated,
} from '../lib/types';

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  isActive: boolean;
  variants: { id?: number; name: string; stock: number }[];
  images?: string[];
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<{ stats: DashboardStats }>('/admin/stats'),
    select: (data) => data.stats,
  });
}

export function useAdminProducts(page = 1, q?: string) {
  return useQuery({
    queryKey: ['admin', 'products', { page, q }],
    queryFn: () => api.get<Paginated<AdminProduct>>(`/admin/products${qs({ page, q })}`),
    placeholderData: (previous) => previous,
  });
}

/** Any catalog write invalidates both the admin table and the public storefront. */
function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['product'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };
}

export function useCreateProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: ProductPayload) => api.post<{ id: number }>('/admin/products', input),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, ...input }: ProductPayload & { id: number }) =>
      api.patch<{ id: number }>(`/admin/products/${id}`, input),
    onSuccess: invalidate,
  });
}

export function useToggleProductListing() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.post<{ id: number; isActive: boolean }>(
        `/admin/products/${id}/${isActive ? 'relist' : 'delist'}`,
      ),
    onSuccess: invalidate,
  });
}

export function useAdminOrders(page = 1, status?: OrderStatus) {
  return useQuery({
    queryKey: ['admin', 'orders', { page, status }],
    queryFn: () =>
      api.get<Paginated<AdminOrderSummary>>(`/admin/orders${qs({ page, status })}`),
    placeholderData: (previous) => previous,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      api.patch<{ orderId: number; status: OrderStatus }>(`/admin/orders/${id}/status`, {
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['order'], exact: false });
    },
  });
}
