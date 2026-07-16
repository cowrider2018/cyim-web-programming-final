import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState, FormError, Spinner, StatusBadge } from '../components/ui';
import { useCancelOrder, useOrder } from '../hooks/use-orders';
import { formatDateTime, formatPrice, paymentMethodLabels } from '../lib/format';

const cancellableStatuses = ['pending', 'paid'];

export function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const [searchParams] = useSearchParams();
  const justPlaced = searchParams.get('placed') === '1';

  const order = useOrder(orderId);
  const cancelOrder = useCancelOrder();

  if (order.isPending) return <Spinner />;
  if (order.isError) {
    return (
      <div className="mx-auto w-[90%] max-w-3xl py-12">
        <ErrorState error={order.error} onRetry={() => order.refetch()} />
      </div>
    );
  }

  const data = order.data;
  const canCancel = cancellableStatuses.includes(data.status);

  return (
    <div className="mx-auto w-[90%] max-w-3xl py-10">
      {justPlaced && (
        <div
          role="status"
          className="mb-8 rounded-[20px] bg-taupe-200 p-6 text-center shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
        >
          <p className="text-3xl italic text-ink">訂單已送出</p>
          <p className="mt-2 text-sm text-ink-soft">感謝你的訂購，我們會在兩個工作天內出貨。</p>
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-4 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">訂單 #{data.id}</h1>
            <StatusBadge status={data.status} />
          </div>
          <p className="mt-1.5 text-sm text-ink-faint">{formatDateTime(data.createdAt)}</p>
        </div>

        {canCancel && (
          <button
            type="button"
            className="rounded-[10px] border-2 border-taupe-400 bg-white px-4 py-2 text-sm text-taupe-600 hover:bg-taupe-100"
            disabled={cancelOrder.isPending}
            onClick={() => {
              if (window.confirm('確定要取消這筆訂單嗎？庫存將會歸還。')) {
                cancelOrder.mutate(data.id);
              }
            }}
          >
            {cancelOrder.isPending ? '取消中…' : '取消訂單'}
          </button>
        )}
      </header>

      <FormError error={cancelOrder.error} />

      <section className="surface mt-4 divide-y divide-taupe-200">
        {data.items.map((item) => (
          <div key={item.id} className="flex gap-4 p-5">
            <Link
              to={`/product/${item.productId}`}
              className="size-20 shrink-0 overflow-hidden rounded-[5px] bg-taupe-100"
            >
              {item.imageUrl && (
                <img src={item.imageUrl} alt="" className="size-full object-cover" />
              )}
            </Link>
            <div className="flex-1">
              <Link to={`/product/${item.productId}`} className="text-sm font-medium hover:underline">
                {item.productName}
              </Link>
              <p className="mt-0.5 text-xs text-ink-faint">{item.variantName}</p>
              <p className="mt-1 text-xs text-ink-faint">
                {formatPrice(item.unitPrice)} × {item.quantity}
              </p>
              {item.hasReview && <p className="mt-1.5 text-xs text-taupe-600">已評價</p>}
            </div>
            <p className="text-lg">{formatPrice(item.lineTotal)}</p>
          </div>
        ))}

        <dl className="space-y-2 p-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">小計</dt>
            <dd>{formatPrice(data.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">運費</dt>
            <dd>{data.shippingFee === 0 ? '免運' : formatPrice(data.shippingFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-taupe-200 pt-2 text-lg">
            <dt className="font-medium">總計</dt>
            <dd className="font-bold">{formatPrice(data.totalPrice)}</dd>
          </div>
        </dl>
      </section>

      <section className="surface mt-6 grid gap-6 p-6 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-ink-faint uppercase">
            配送資訊
          </h2>
          <div className="mt-3 space-y-1.5 text-sm">
            <p>{data.recipientName}</p>
            <p className="text-ink-soft">{data.recipientPhone}</p>
            <p className="text-ink-soft">{data.shippingAddress}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold tracking-widest text-ink-faint uppercase">
            付款資訊
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">付款方式</dt>
              <dd>{paymentMethodLabels[data.paymentMethod]}</dd>
            </div>
            {data.cardLast4 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">信用卡</dt>
                <dd>**** {data.cardLast4}</dd>
              </div>
            )}
          </dl>
        </div>

        {data.notes && (
          <div className="sm:col-span-2">
            <h2 className="text-xs font-semibold tracking-widest text-ink-faint uppercase">
              訂單備註
            </h2>
            <p className="mt-2 text-sm text-ink-soft">{data.notes}</p>
          </div>
        )}
      </section>

      <div className="mt-8 flex gap-3">
        <Link to="/account" className="btn-outline">
          返回會員中心
        </Link>
        <Link to="/store" className="btn-link">
          繼續選購
        </Link>
      </div>
    </div>
  );
}
