import { useQuery } from '@tanstack/react-query';
import { api, qs } from '../lib/api';
import type {
  Category,
  Paginated,
  ProductDetail,
  ProductSummary,
  RelatedProduct,
  Review,
} from '../lib/types';

export interface ProductFilters {
  category?: string;
  q?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ categories: Category[] }>('/categories'),
    // The category list changes about as often as the shop is redesigned.
    staleTime: 10 * 60 * 1000,
    select: (data) => data.categories,
  });
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () =>
      api.get<Paginated<ProductSummary>>(
        `/products${qs({
          category: filters.category,
          q: filters.q,
          sort: filters.sort,
          page: filters.page,
        })}`,
      ),
    placeholderData: (previous) => previous,
  });
}

export function useNewArrivals() {
  return useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => api.get<{ products: ProductSummary[] }>('/products/new-arrivals'),
    select: (data) => data.products,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<{ product: ProductDetail }>(`/products/${id}`),
    select: (data) => data.product,
    enabled: Number.isFinite(id),
  });
}

export function useRelatedProducts(id: number) {
  return useQuery({
    queryKey: ['product', id, 'related'],
    queryFn: () => api.get<{ products: RelatedProduct[] }>(`/products/${id}/related`),
    select: (data) => data.products,
    enabled: Number.isFinite(id),
  });
}

export function useProductReviews(id: number, page = 1) {
  return useQuery({
    queryKey: ['product', id, 'reviews', page],
    queryFn: () => api.get<Paginated<Review>>(`/products/${id}/reviews${qs({ page })}`),
    enabled: Number.isFinite(id),
  });
}
