import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import { EmptyState, ErrorState, Pagination } from '../components/ui';
import { ChevronDown, CloseIcon } from '../components/icons';
import { useCategories, useProducts } from '../hooks/use-catalog';

const sortOptions = [
  { value: 'newest', label: '最新上架' },
  { value: 'price_asc', label: '價格由低到高' },
  { value: 'price_desc', label: '價格由高到低' },
] as const;

export function StorePage() {
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
  const eyebrow = q ? 'Search' : (activeCategory?.nameEn ?? 'All Products');

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active
        ? 'border-ink bg-ink text-cream'
        : 'border-line-strong text-ink-soft hover:border-ink hover:text-ink'
    }`;

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <header className="border-b border-line pb-8 text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-display text-5xl font-semibold text-ink">{heading}</h1>
      </header>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => updateParams({ category: undefined, q: undefined })} className={chip(!category && !q)}>
            全部
          </button>
          {categories.data?.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => updateParams({ category: item.slug, q: undefined })}
              className={chip(category === item.slug)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-xs tracking-wide text-ink-faint">
            排序
          </label>
          <div className="relative">
            <select
              id="sort"
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="appearance-none rounded-[var(--radius)] border border-line-strong bg-surface py-2 pr-9 pl-3.5 text-sm text-ink focus:border-gold focus:outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-faint"
            />
          </div>
        </div>
      </div>

      {q && (
        <button
          type="button"
          onClick={() => updateParams({ q: undefined })}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
        >
          清除搜尋 <CloseIcon size={14} />
        </button>
      )}

      <div className="mt-8">
        {products.isPending ? (
          <ProductGridSkeleton />
        ) : products.isError ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        ) : products.data.items.length === 0 ? (
          <EmptyState
            title="找不到符合的商品"
            description={q ? `沒有與「${q}」相符的商品，換個關鍵字試試。` : '這個分類目前沒有商品。'}
          />
        ) : (
          <>
            <p className="pb-6 text-sm text-ink-faint">
              共 {products.data.pagination.total} 件商品
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {products.data.items.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.imageUrl}
                  categoryName={product.category.name}
                  averageRating={product.averageRating}
                  reviewCount={product.reviewCount}
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
      </div>
    </section>
  );
}
