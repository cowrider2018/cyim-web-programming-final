import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, FormError, Spinner } from '../components/ui';
import {
  useCart,
  useClearCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from '../hooks/use-cart';
import { formatPrice } from '../lib/format';

export function CartPage() {
  const cart = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  if (cart.isError) {
    return (
      <div className="mx-auto w-[90%] max-w-3xl py-12">
        <ErrorState error={cart.error} onRetry={() => cart.refetch()} />
      </div>
    );
  }

  const data = cart.data;
  if (cart.isPending || !data) return <Spinner />;

  if (data.items.length === 0) {
    return (
      <div className="mx-auto w-[90%] max-w-3xl py-12">
        <h1 className="pb-8 text-3xl font-bold italic">購物車</h1>
        <EmptyState
          title="購物車是空的"
          description="還沒有選購任何商品，去看看有什麼適合你的吧。"
          action={
            <Link to="/store" className="btn-taupe mt-2">
              開始選購
            </Link>
          }
        />
      </div>
    );
  }

  const mutationError = updateItem.error ?? removeItem.error;

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="surface w-full max-w-4xl p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">購物車</h1>
          <button
            type="button"
            onClick={() => clearCart.mutate()}
            disabled={clearCart.isPending}
            className="btn-link"
          >
            清空購物車
          </button>
        </div>

        {mutationError && (
          <div className="pt-4">
            <FormError error={mutationError} />
          </div>
        )}

        <div className="mt-6 flex flex-col">
          {data.items.map((item) => {
            const overStock = item.quantity > item.stock;
            return (
              <div
                key={item.variantId}
                className="flex items-center gap-4 border-b border-taupe-300 py-4"
              >
                <Link
                  to={`/product/${item.productId}`}
                  className="size-24 shrink-0 overflow-hidden rounded-[5px] bg-taupe-100"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="size-full object-cover"
                    />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/product/${item.productId}`}
                    className="text-sm hover:underline"
                  >
                    {item.productName}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-faint">{item.variantName}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    單價 {formatPrice(item.unitPrice)}
                  </p>
                  {overStock && (
                    <p className="mt-1 text-xs text-red-700">
                      庫存不足，目前僅剩 {item.stock} 件
                    </p>
                  )}
                </div>

                <div className="flex h-9 items-center overflow-hidden rounded-[20px] border border-black">
                  <button
                    type="button"
                    aria-label={`減少 ${item.productName} 的數量`}
                    className="h-full w-9 text-lg leading-none disabled:opacity-30"
                    disabled={updateItem.isPending}
                    onClick={() =>
                      updateItem.mutate({
                        variantId: item.variantId,
                        quantity: item.quantity - 1,
                      })
                    }
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`增加 ${item.productName} 的數量`}
                    className="h-full w-9 text-lg leading-none disabled:opacity-30"
                    disabled={updateItem.isPending || item.quantity >= item.stock}
                    onClick={() =>
                      updateItem.mutate({
                        variantId: item.variantId,
                        quantity: item.quantity + 1,
                      })
                    }
                  >
                    +
                  </button>
                </div>

                <p className="w-20 shrink-0 text-right text-sm">
                  {formatPrice(item.lineTotal)}
                </p>

                <button
                  type="button"
                  onClick={() => removeItem.mutate(item.variantId)}
                  className="shrink-0 rounded-[3px] border-2 border-taupe-400 bg-taupe-400 px-2.5 py-1 text-xs text-white hover:border-taupe-600 hover:bg-taupe-600"
                >
                  移除
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-end gap-1.5">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">小計（{data.itemCount} 件）</dt>
              <dd>{formatPrice(data.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">運費</dt>
              <dd>{data.shippingFee === 0 ? '免運' : formatPrice(data.shippingFee)}</dd>
            </div>
            {data.shippingFee > 0 && (
              <p className="text-xs text-ink-faint">
                再購買 {formatPrice(data.freeShippingThreshold - data.subtotal)} 即可免運
              </p>
            )}
            <div className="flex justify-between border-t border-taupe-300 pt-2 text-lg">
              <dt className="font-medium">總計</dt>
              <dd className="font-bold">{formatPrice(data.total)}</dd>
            </div>
          </dl>

          <Link to="/checkout" className="btn-taupe mt-4 px-8 py-3">
            前往結帳
          </Link>
          <Link to="/store" className="btn-link">
            繼續選購
          </Link>
        </div>
      </div>
    </div>
  );
}
