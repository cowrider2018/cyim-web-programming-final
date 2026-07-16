import { useState, type FormEvent } from 'react';
import {
  ErrorState,
  FormError,
  Pagination,
  Spinner,
} from '../../components/ui';
import {
  useAdminProducts,
  useCreateProduct,
  useToggleProductListing,
  useUpdateProduct,
  type ProductPayload,
} from '../../hooks/use-admin';
import { useCategories } from '../../hooks/use-catalog';
import { formatPrice } from '../../lib/format';
import type { AdminProduct } from '../../lib/types';

type Editing = { mode: 'create' } | { mode: 'edit'; product: AdminProduct } | null;

export function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState<string | undefined>();
  const [editing, setEditing] = useState<Editing>(null);

  const products = useAdminProducts(page, query);
  const toggleListing = useToggleProductListing();

  if (products.isPending) return <Spinner />;
  if (products.isError) {
    return <ErrorState error={products.error} onRetry={() => products.refetch()} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            setQuery(search.trim() || undefined);
            setPage(1);
          }}
          role="search"
          className="flex gap-2"
        >
          <label htmlFor="admin-search" className="sr-only">
            搜尋商品
          </label>
          <input
            id="admin-search"
            type="search"
            className="input h-10 w-56"
            placeholder="搜尋商品名稱…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="btn-outline">
            搜尋
          </button>
        </form>

        <button
          type="button"
          className="btn-taupe"
          onClick={() => setEditing({ mode: 'create' })}
        >
          + 上架新品
        </button>
      </div>

      {editing && (
        <ProductForm
          key={editing.mode === 'edit' ? editing.product.id : 'create'}
          editing={editing}
          onClose={() => setEditing(null)}
        />
      )}

      <FormError error={toggleListing.error} />

      <div className="surface mt-4 overflow-x-auto">
        <table className="w-full min-w-3xl text-sm">
          <thead>
            <tr className="border-b border-taupe-200 text-left text-xs text-ink-faint">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">商品</th>
              <th className="p-4 font-medium">分類</th>
              <th className="p-4 text-right font-medium">價格</th>
              <th className="p-4 font-medium">規格 / 庫存</th>
              <th className="p-4 font-medium">狀態</th>
              <th className="p-4 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-taupe-200">
            {products.data.items.map((product) => (
              <tr key={product.id} className={product.isActive ? '' : 'bg-taupe-100/60'}>
                <td className="p-4 text-ink-faint">#{product.id}</td>
                <td className="max-w-56 p-4">
                  <p className="truncate text-ink">{product.name}</p>
                </td>
                <td className="p-4 text-ink-soft">{product.categoryName}</td>
                <td className="p-4 text-right text-ink">
                  {formatPrice(product.price)}
                </td>
                <td className="p-4">
                  <ul className="space-y-1">
                    {product.variants.map((variant) => (
                      <li key={variant.id} className="flex gap-2 text-xs">
                        <span className="text-ink-soft">{variant.name}</span>
                        <span
                          className={
                            variant.stock === 0
                              ? 'text-red-700'
                              : variant.stock <= 2
                                ? 'text-amber-700'
                                : 'text-ink-faint'
                          }
                        >
                          {variant.stock}
                        </span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs ${
                      product.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-taupe-200 text-ink-soft'
                    }`}
                  >
                    {product.isActive ? '販售中' : '已下架'}
                  </span>
                </td>
                <td className="p-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    className="text-xs text-ink-faint hover:text-ink"
                    onClick={() => setEditing({ mode: 'edit', product })}
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    className="ml-3 text-xs text-ink-faint hover:text-red-700"
                    disabled={toggleListing.isPending}
                    onClick={() =>
                      toggleListing.mutate({
                        id: product.id,
                        isActive: !product.isActive,
                      })
                    }
                  >
                    {product.isActive ? '下架' : '重新上架'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={products.data.pagination.page}
        totalPages={products.data.pagination.totalPages}
        onChange={setPage}
      />
    </div>
  );
}

interface VariantDraft {
  id?: number;
  name: string;
  stock: number;
}

function ProductForm({ editing, onClose }: { editing: Editing; onClose: () => void }) {
  const categories = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const existing = editing?.mode === 'edit' ? editing.product : null;

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    description: existing?.description ?? '',
    price: existing ? String(existing.price) : '',
    categoryId: existing ? String(existing.categoryId) : '',
    isActive: existing?.isActive ?? true,
  });

  const [variants, setVariants] = useState<VariantDraft[]>(
    existing?.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      stock: variant.stock,
    })) ?? [{ name: '標準', stock: 10 }],
  );

  const mutation = existing ? updateProduct : createProduct;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const payload: ProductPayload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      categoryId: Number(form.categoryId),
      isActive: form.isActive,
      variants: variants.map((variant) => ({
        ...(variant.id ? { id: variant.id } : {}),
        name: variant.name,
        stock: variant.stock,
      })),
    };

    if (existing) {
      await updateProduct.mutateAsync({ ...payload, id: existing.id });
    } else {
      await createProduct.mutateAsync(payload);
    }
    onClose();
  }

  function updateVariant(index: number, changes: Partial<VariantDraft>) {
    setVariants((previous) =>
      previous.map((variant, i) => (i === index ? { ...variant, ...changes } : variant)),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-ink">
          {existing ? `編輯商品 #${existing.id}` : '上架新品'}
        </h2>
        <button type="button" onClick={onClose} className="btn-link">
          關閉 ✕
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="product-name">
            商品名稱
          </label>
          <input
            id="product-name"
            className="input"
            required
            maxLength={60}
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, name: event.target.value }))
            }
          />
        </div>

        <div>
          <label className="label" htmlFor="product-category">
            分類
          </label>
          <select
            id="product-category"
            className="input"
            required
            value={form.categoryId}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, categoryId: event.target.value }))
            }
          >
            <option value="">請選擇…</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="product-price">
            價格（NT$）
          </label>
          <input
            id="product-price"
            type="number"
            min={1}
            className="input"
            required
            value={form.price}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, price: event.target.value }))
            }
          />
        </div>

        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2.5 pb-2.5">
            <input
              type="checkbox"
              className="size-4 accent-black"
              checked={form.isActive}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, isActive: event.target.checked }))
              }
            />
            <span className="text-sm text-ink-soft">立即上架販售</span>
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="product-description">
            商品描述
          </label>
          <textarea
            id="product-description"
            rows={3}
            className="input resize-none"
            value={form.description}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, description: event.target.value }))
            }
          />
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="label">規格與庫存</legend>

        <ul className="space-y-2">
          {variants.map((variant, index) => (
            <li key={variant.id ?? `new-${index}`} className="flex gap-2">
              <input
                aria-label={`規格 ${index + 1} 名稱`}
                className="input flex-1"
                required
                maxLength={30}
                placeholder="規格名稱"
                value={variant.name}
                onChange={(event) => updateVariant(index, { name: event.target.value })}
              />
              <input
                aria-label={`規格 ${index + 1} 庫存`}
                type="number"
                min={0}
                className="input w-28"
                required
                value={variant.stock}
                onChange={(event) =>
                  updateVariant(index, { stock: Number(event.target.value) })
                }
              />
              <button
                type="button"
                className="btn-link px-3"
                disabled={variants.length <= 1}
                onClick={() =>
                  setVariants((previous) => previous.filter((_, i) => i !== index))
                }
                aria-label={`移除規格 ${index + 1}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="btn-outline mt-3"
          onClick={() => setVariants((previous) => [...previous, { name: '', stock: 0 }])}
        >
          + 新增規格
        </button>

        <p className="mt-2 text-xs text-ink-faint">
          已被訂購過的規格無法刪除，請將庫存設為 0。
        </p>
      </fieldset>

      <div className="mt-6 flex items-center gap-3">
        <button type="submit" disabled={mutation.isPending} className="btn-taupe">
          {mutation.isPending ? '儲存中…' : existing ? '儲存變更' : '上架商品'}
        </button>
        <button type="button" onClick={onClose} className="btn-link">
          取消
        </button>
      </div>

      <div className="mt-4">
        <FormError error={mutation.error} />
      </div>
    </form>
  );
}
