import { Link } from 'react-router-dom';
import { ErrorState, Spinner, StatusBadge } from '../../components/ui';
import { useAdminStats } from '../../hooks/use-admin';
import { formatPrice } from '../../lib/format';

export function AdminDashboardPage() {
  const stats = useAdminStats();

  if (stats.isPending) return <Spinner />;
  if (stats.isError) return <ErrorState error={stats.error} onRetry={() => stats.refetch()} />;

  const data = stats.data;

  const tiles = [
    { label: '總營收', value: formatPrice(data.totalRevenue), hint: '不含已取消訂單' },
    { label: '訂單數', value: String(data.orderCount), hint: '不含已取消訂單' },
    { label: '會員數', value: String(data.customerCount), hint: '不含管理者帳號' },
    { label: '上架商品', value: String(data.activeProductCount), hint: '目前販售中' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="surface p-5">
            <p className="text-xs tracking-wide text-ink-faint">{tile.label}</p>
            <p className="mt-2 text-3xl text-ink">{tile.value}</p>
            <p className="mt-1 text-xs text-ink-faint">{tile.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6">
          <h2 className="text-2xl text-ink">訂單狀態</h2>
          {data.ordersByStatus.length === 0 ? (
            <p className="mt-4 text-sm text-ink-faint">目前還沒有訂單。</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {data.ordersByStatus.map((row) => (
                <li key={row.status} className="flex items-center justify-between">
                  <StatusBadge status={row.status} />
                  <span className="text-sm text-ink-soft">{row.total} 筆</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/orders"
            className="mt-5 inline-block text-sm text-ink-faint hover:text-ink"
          >
            管理訂單 →
          </Link>
        </section>

        <section className="surface p-6">
          <h2 className="text-2xl text-ink">低庫存警示</h2>
          <p className="mt-1 text-xs text-ink-faint">庫存 2 件以下的規格</p>
          {data.lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-ink-faint">目前沒有低庫存商品。</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {data.lowStock.map((row) => (
                <li key={row.variantId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/product/${row.productId}`}
                      className="block truncate text-sm text-ink hover:underline"
                    >
                      {row.productName}
                    </Link>
                    <p className="text-xs text-ink-faint">{row.variantName}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${
                      row.stock === 0
                        ? 'bg-taupe-100 text-taupe-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {row.stock === 0 ? '售完' : `剩 ${row.stock}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="surface p-6">
        <h2 className="text-2xl text-ink">熱銷排行</h2>
        {data.topProducts.length === 0 ? (
          <p className="mt-4 text-sm text-ink-faint">還沒有銷售資料。</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-taupe-200 text-left text-xs text-ink-faint">
                  <th className="pb-2 font-medium">商品</th>
                  <th className="pb-2 text-right font-medium">售出</th>
                  <th className="pb-2 text-right font-medium">營收</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taupe-200">
                {data.topProducts.map((row) => (
                  <tr key={row.productId}>
                    <td className="py-3">
                      <Link
                        to={`/product/${row.productId}`}
                        className="text-ink hover:underline"
                      >
                        {row.productName}
                      </Link>
                    </td>
                    <td className="py-3 text-right text-ink-soft">{row.unitsSold}</td>
                    <td className="py-3 text-right text-ink">
                      {formatPrice(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
