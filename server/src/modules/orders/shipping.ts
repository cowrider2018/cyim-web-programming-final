/**
 * Shipping rules live on the server so the client can never negotiate the
 * price it pays. The storefront shows the same numbers, but only the values
 * computed here are ever written to an order.
 */
export const FREE_SHIPPING_THRESHOLD = 1000;
export const SHIPPING_FEE = 60;

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
