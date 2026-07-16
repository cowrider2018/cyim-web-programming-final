import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EmptyState,
  ErrorState,
  FormError,
  Pagination,
  Spinner,
  StatusBadge,
} from '../../components/ui';
import { useAdminOrders, useUpdateOrderStatus } from '../../hooks/use-admin';
import {
  formatDateTime,
  formatPrice,
  orderStatusLabels,
  paymentMethodLabels,
} from '../../lib/format';
import type { OrderStatus } from '../../lib/types';

/** Mirrors the server's state machine so the UI only offers legal moves. */
const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

const filters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待付款' },
  { value: 'paid', label: '已付款' },
  { value: 'shipped', label: '已出貨' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');

  const orders = useAdminOrders(page, status === 'all' ? undefined : status);
  const updateStatus = useUpdateOrderStatus();

  if (orders.isPending) return <Spinner />;
  if (orders.isError) {
    return <ErrorState error={orders.error} onRetry={() => orders.refetch()} />;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 pb-6">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
            className={status === filter.value ? 'btn-primary' : 'btn-outline'}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <FormError error={updateStatus.error} />

      {orders.data.items.length === 0 ? (
        <EmptyState title="沒有符合的訂單" />
      ) : (
        <>
          <div className="surface mt-4 overflow-x-auto">
            <table className="w-full min-w-3xl text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-faint">
                  <th className="p-4 font-medium">訂單</th>
                  <th className="p-4 font-medium">顧客</th>
                  <th className="p-4 font-medium">配送</th>
                  <th className="p-4 text-right font-medium">金額</th>
                  <th className="p-4 font-medium">狀態</th>
                  <th className="p-4 font-medium">變更狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.data.items.map((order) => {
                  const options = nextStatuses[order.status];
                  return (
                    <tr key={order.id}>
                      <td className="p-4">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-ink hover:underline"
                        >
                          #{order.id}
                        </Link>
                        <p className="mt-0.5 text-xs text-ink-faint">
                          {formatDateTime(order.createdAt)}
                        </p>
                        <p className="text-xs text-ink-faint">{order.itemCount} 件</p>
                      </td>

                      <td className="max-w-40 p-4">
                        <p className="truncate text-ink">{order.customer.name}</p>
                        <p className="truncate text-xs text-ink-faint">
                          {order.customer.email}
                        </p>
                      </td>

                      <td className="max-w-48 p-4">
                        <p className="text-ink-soft">{order.recipientName}</p>
                        <p className="truncate text-xs text-ink-faint">
                          {order.shippingAddress}
                        </p>
                      </td>

                      <td className="p-4 text-right">
                        <p className="text-ink">{formatPrice(order.totalPrice)}</p>
                        <p className="text-xs text-ink-faint">
                          {paymentMethodLabels[order.paymentMethod]}
                        </p>
                      </td>

                      <td className="p-4">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="p-4">
                        {options.length === 0 ? (
                          <span className="text-xs text-ink-faint">已結束</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {options.map((option) => (
                              <button
                                key={option}
                                type="button"
                                disabled={updateStatus.isPending}
                                onClick={() => {
                                  if (
                                    option === 'cancelled' &&
                                    !window.confirm('確定取消這筆訂單？庫存將會歸還。')
                                  ) {
                                    return;
                                  }
                                  updateStatus.mutate({ id: order.id, status: option });
                                }}
                                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                                  option === 'cancelled'
                                    ? 'border-line-strong text-gold hover:bg-stone-100'
                                    : 'border-line-strong text-ink-soft hover:bg-stone-100'
                                }`}
                              >
                                → {orderStatusLabels[option]}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={orders.data.pagination.page}
            totalPages={orders.data.pagination.totalPages}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
