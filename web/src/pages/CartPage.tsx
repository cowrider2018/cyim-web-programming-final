import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, FormError, Spinner } from '../components/ui';
import { MinusIcon, PlusIcon, TrashIcon } from '../components/icons';
import { asset } from '../lib/asset';
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
      <div className="mx-auto max-w-3xl px-5 py-12">
        <ErrorState error={cart.error} onRetry={() => cart.refetch()} />
      </div>
    );
  }

  const data = cart.data;
  if (cart.isPending || !data) return <Spinner />;

  if (data.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="pb-8 text-center font-display text-5xl font-semibold">購物車</h1>
        <EmptyState
          title="購物車是空的"
          description="還沒有選購任何商品，去看看有什麼適合你的吧。"
          action={
            <Link to="/store" className="btn-primary mt-2">
              開始選購
            </Link>
          }
        />
      </div>
    );
  }

  const mutationError = updateItem.error ?? removeItem.error;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <header className="flex items-center justify-between border-b border-line pb-6">
        <h1 className="font-display text-5xl font-semibold">購物車</h1>
        <button
          type="button"
          onClick={() => clearCart.mutate()}
          disabled={clearCart.isPending}
          className="text-sm text-ink-faint hover:text-ink"
        >
          清空購物車
        </button>
      </header>

      {mutationError && (
        <div className="pt-4">
          <FormError error={mutationError} />
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <ul>
          {data.items.map((item) => {
            const overStock = item.quantity > item.stock;
            return (
              <li
                key={item.variantId}
                className="flex gap-5 border-b border-line py-6 first:pt-0"
              >
                <Link
                  to={`/product/${item.productId}`}
                  className="group size-28 shrink-0 overflow-hidden rounded-[var(--radius)] border border-line bg-stone-100"
                >
                  {item.imageUrl && (
                    <img
                      src={asset(item.imageUrl)}
                      alt={item.productName}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                </Link>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/product/${item.productId}`}
                        className="text-sm text-ink hover:text-gold"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-xs text-ink-faint">{item.variantName}</p>
                      <p className="mt-1 text-xs text-ink-faint">
                        單價 {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem.mutate(item.variantId)}
                      className="p-1 text-ink-faint transition-colors hover:text-danger"
                      aria-label={`移除 ${item.productName}`}
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>

                  {overStock && (
                    <p className="mt-1 text-xs text-danger">庫存不足，目前僅剩 {item.stock} 件</p>
                  )}

                  <div className="mt-auto flex items-end justify-between pt-4">
                    <div className="flex items-center rounded-full border border-line-strong">
                      <button
                        type="button"
                        aria-label={`減少 ${item.productName} 的數量`}
                        className="flex size-9 items-center justify-center text-ink disabled:opacity-30"
                        disabled={updateItem.isPending}
                        onClick={() =>
                          updateItem.mutate({
                            variantId: item.variantId,
                            quantity: item.quantity - 1,
                          })
                        }
                      >
                        <MinusIcon size={15} />
                      </button>
                      <span className="w-9 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`增加 ${item.productName} 的數量`}
                        className="flex size-9 items-center justify-center text-ink disabled:opacity-30"
                        disabled={updateItem.isPending || item.quantity >= item.stock}
                        onClick={() =>
                          updateItem.mutate({
                            variantId: item.variantId,
                            quantity: item.quantity + 1,
                          })
                        }
                      >
                        <PlusIcon size={15} />
                      </button>
                    </div>

                    <p className="font-display text-xl font-semibold text-ink">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit lg:sticky lg:top-24">
          <div className="surface p-6">
            <h2 className="font-display text-2xl font-semibold">訂單摘要</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">小計（{data.itemCount} 件）</dt>
                <dd className="text-ink">{formatPrice(data.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">運費</dt>
                <dd className="text-ink">
                  {data.shippingFee === 0 ? '免運' : formatPrice(data.shippingFee)}
                </dd>
              </div>
              {data.shippingFee > 0 && (
                <p className="text-xs text-ink-faint">
                  再購買 {formatPrice(data.freeShippingThreshold - data.subtotal)} 即可免運
                </p>
              )}
              <div className="flex justify-between border-t border-line pt-3">
                <dt className="font-medium text-ink">總計</dt>
                <dd className="font-display text-2xl font-semibold text-ink">
                  {formatPrice(data.total)}
                </dd>
              </div>
            </dl>

            <Link to="/checkout" className="btn-primary mt-6 w-full py-3.5">
              前往結帳
            </Link>
            <Link
              to="/store"
              className="mt-3 block text-center text-sm text-ink-soft hover:text-ink"
            >
              繼續選購
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
