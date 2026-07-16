import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { EmptyState, ErrorState, Pagination, Spinner } from '../components/ui';
import { useCategories, useProducts } from '../hooks/use-catalog';

const sortOptions = [
  { value: 'newest', label: '最新上架' },
  { value: 'price_asc', label: '價格由低到高' },
  { value: 'price_desc', label: '價格由高到低' },
] as const;

export function StorePage() {
  // Filter state lives in the URL so results are shareable and the back button
  // behaves.
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const sort = (searchParams.get('sort') as (typeof sortOptions)[number]['value']) ?? 'newest';
  const page = Number(searchParams.get('page') ?? '1');

  const categories = useCategories();
  const products = useProducts({ category, q, sort, page });

  function updateParams(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    if (!('page' in changes)) next.delete('page');
    setSearchParams(next);
  }

  const activeCategory = categories.data?.find((item) => item.slug === category);
  const heading = q ? `搜尋「${q}」` : (activeCategory?.name ?? '全部商品');

  return (
    <section className="mx-auto flex w-[80%] max-w-5xl flex-col py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={() => updateParams({ category: undefined })}
            className={`nav-item text-lg ${category ? '' : 'border-[#555555] font-medium'}`}
          >
            全部
          </button>
          {categories.data?.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => updateParams({ category: item.slug })}
              className={`nav-item text-lg ${
                category === item.slug ? 'border-[#555555] font-medium' : ''
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-ink-soft">
            排序
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className="rounded-md border border-taupe-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-taupe-400 focus:outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h1 className="mt-8 text-3xl font-bold">{heading}</h1>
      {activeCategory && <p className="mt-1 text-sm text-ink-faint">{activeCategory.nameEn}</p>}

      {products.isPending ? (
        <Spinner />
      ) : products.isError ? (
        <div className="mt-8">
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        </div>
      ) : products.data.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="找不到符合的商品"
            description={q ? `沒有與「${q}」相符的商品，換個關鍵字試試。` : '這個分類目前沒有商品。'}
          />
        </div>
      ) : (
        <>
          <p className="pt-4 pb-6 text-sm text-ink-faint">
            共 {products.data.pagination.total} 件商品
          </p>
          <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3">
            {products.data.items.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                totalStock={product.totalStock}
              />
            ))}
          </div>
          <Pagination
            page={products.data.pagination.page}
            totalPages={products.data.pagination.totalPages}
            onChange={(next) => updateParams({ page: String(next) })}
          />
        </>
      )}
    </section>
  );
}
