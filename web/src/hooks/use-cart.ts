import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '../lib/api';
import { useAuth } from '../context/auth';
import type { Cart } from '../lib/types';

const emptyCart: Cart = {
  items: [],
  subtotal: 0,
  shippingFee: 0,
  total: 0,
  freeShippingThreshold: 1000,
  itemCount: 0,
};

export function useCart() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        const { cart } = await api.get<{ cart: Cart }>('/cart');
        return cart;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return emptyCart;
        throw error;
      }
    },
    // Only signed-in users have a server-side cart. Deliberately no
    // placeholderData: an empty cart while loading is indistinguishable from a
    // genuinely empty one, which made checkout redirect away mid-fetch.
    enabled: Boolean(user),
  });
}

/** Every mutation returns the whole cart, so the cache is replaced rather than refetched. */
function useCartMutation<TInput>(
  mutationFn: (input: TInput) => Promise<{ cart: Cart }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: ({ cart }) => {
      queryClient.setQueryData(['cart'], cart);
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { variantId: number; quantity: number }) =>
      api.post<{ cart: Cart }>('/cart/items', input),
    onSuccess: ({ cart }, variables) => {
      queryClient.setQueryData(['cart'], cart);
      // Stock shown on the product page moves when a cart line is created.
      queryClient.invalidateQueries({ queryKey: ['product'], exact: false });
      void variables;
    },
  });
}

export function useUpdateCartItem() {
  return useCartMutation((input: { variantId: number; quantity: number }) =>
    api.patch<{ cart: Cart }>(`/cart/items/${input.variantId}`, {
      quantity: input.quantity,
    }),
  );
}

export function useRemoveCartItem() {
  return useCartMutation((variantId: number) =>
    api.delete<{ cart: Cart }>(`/cart/items/${variantId}`),
  );
}

export function useClearCart() {
  return useCartMutation<void>(() => api.delete<{ cart: Cart }>('/cart'));
}
