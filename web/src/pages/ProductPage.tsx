import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorState, FormError, Spinner, StarRating } from '../components/ui';
import { useAuth } from '../context/auth';
import { useAddToCart } from '../hooks/use-cart';
import { useProduct, useProductReviews, useRelatedProducts } from '../hooks/use-catalog';
import { formatDate, formatPrice } from '../lib/format';

export function ProductPage() {
  const { id } = useParams();
  const productId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const product = useProduct(productId);
  const related = useRelatedProducts(productId);
  const reviews = useProductReviews(productId);
  const addToCart = useAddToCart();

  const [variantId, setVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!product.data) return;
    const firstAvailable =
      product.data.variants.find((variant) => variant.stock > 0) ?? product.data.variants[0];
    setVariantId(firstAvailable?.id ?? null);
    setQuantity(1);
    setActiveImage(0);
  }, [product.data]);

  if (product.isPending) return <Spinner />;
  if (product.isError) {
    return (
      <div className="mx-auto w-[80%] max-w-5xl py-12">
        <ErrorState error={product.error} onRetry={() => product.refetch()} />
      </div>
    );
  }

  const data = product.data;
  const selectedVariant = data.variants.find((variant) => variant.id === variantId) ?? null;
  const maxQuantity = Math.max(1, selectedVariant?.stock ?? 1);
  const soldOut = !selectedVariant || selectedVariant.stock === 0;
  const hasImages = data.images.length > 0;
  const multipleVariants = data.variants.length > 1;

  function cycleImage(delta: number) {
    setActiveImage((index) => (index + delta + data.images.length) % data.images.length);
  }

  async function handleAddToCart() {
    if (!user) {
      navigate('/login', { state: { from: `/product/${productId}` } });
      return;
    }
    if (!variantId) return;
    await addToCart.mutateAsync({ variantId, quantity });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="mx-auto w-[85%] max-w-5xl py-10">
      <nav aria-label="麵包屑" className="pb-6 text-sm text-ink-faint">
        <Link to="/store" className="hover:text-ink">
          全部商品
        </Link>
        <span className="px-2">/</span>
        <Link to={`/store?category=${data.category.slug}`} className="hover:text-ink">
          {data.category.name}
        </Link>
      </nav>

      <div className="flex flex-col gap-10 md:flex-row md:items-start">
        <div className="relative w-full md:max-w-md md:flex-1">
          <div className="aspect-square overflow-hidden rounded-[5px] bg-taupe-100">
            {hasImages ? (
              <img
                src={data.images[activeImage]?.url}
                alt={data.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-ink-faint">
                尚無圖片
              </div>
            )}
          </div>

          {data.images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="上一張"
                onClick={() => cycleImage(-1)}
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 px-3 py-2 text-white"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="下一張"
                onClick={() => cycleImage(1)}
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 px-3 py-2 text-white"
              >
                ›
              </button>
              <div className="mt-3 flex gap-2">
                {data.images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`檢視第 ${index + 1} 張圖片`}
                    aria-current={index === activeImage}
                    className={`size-16 overflow-hidden rounded-[5px] border-2 ${
                      index === activeImage ? 'border-ink' : 'border-transparent'
                    }`}
                  >
                    <img src={image.url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="w-full md:max-w-md md:flex-1 md:px-5">
          <h2 className="text-2xl">{data.name}</h2>

          <div className="mt-3">
            <StarRating rating={data.averageRating} count={data.reviewCount} size="md" />
          </div>

          <p className="mt-5 text-xl text-ink">{formatPrice(data.price)}</p>

          {data.description && (
            <p className="mt-5 leading-relaxed text-ink-soft">{data.description}</p>
          )}

          {multipleVariants ? (
            <div className="mt-6">
              <label htmlFor="variant" className="label">
                規格
              </label>
              <select
                id="variant"
                value={variantId ?? ''}
                onChange={(event) => {
                  setVariantId(Number(event.target.value));
                  setQuantity(1);
                }}
                className="h-10 w-40 rounded-[20px] border border-black text-center text-sm focus:outline-none"
              >
                {data.variants.map((variant) => (
                  <option key={variant.id} value={variant.id} disabled={variant.stock === 0}>
                    {variant.name}
                    {variant.stock === 0 ? '（售完）' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            selectedVariant &&
            selectedVariant.name !== '標準' && (
              <p className="mt-6 text-sm text-ink-soft">規格：{selectedVariant.name}</p>
            )
          )}

          <div className="mt-6">
            <span className="label">數量</span>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-[120px] items-center overflow-hidden rounded-[20px] border border-black">
                <button
                  type="button"
                  className="h-full w-10 text-2xl leading-none disabled:opacity-30"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  aria-label="減少數量"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) return;
                    setQuantity(Math.min(maxQuantity, Math.max(1, Math.trunc(next))));
                  }}
                  className="h-full w-10 border-x-0 text-center text-lg outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  className="h-full w-10 text-2xl leading-none disabled:opacity-30"
                  onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                  disabled={quantity >= maxQuantity}
                  aria-label="增加數量"
                >
                  +
                </button>
              </div>

              {selectedVariant && (
                <span className="text-sm text-ink-faint">
                  {selectedVariant.stock > 0
                    ? selectedVariant.stock <= 3
                      ? `僅剩 ${selectedVariant.stock} 件`
                      : `庫存 ${selectedVariant.stock} 件`
                    : '此規格已售完'}
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={soldOut || addToCart.isPending}
              className="btn-dark w-full py-3"
            >
              {addToCart.isPending ? '加入中…' : soldOut ? '已售完' : '加入購物車'}
            </button>

            {added && (
              <p
                role="status"
                className="rounded-lg bg-taupe-100 px-3.5 py-2.5 text-center text-sm text-ink"
              >
                已加入購物車 ·{' '}
                <Link to="/cart" className="underline">
                  前往結帳
                </Link>
              </p>
            )}

            <FormError error={addToCart.error} />
          </div>
        </div>
      </div>

      <section className="mt-16">
        <div className="mx-auto max-w-3xl rounded-[15px] bg-taupe-200 p-6 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
          <h2 className="mb-5 text-center text-2xl">
            商品評價
            {reviews.data && reviews.data.pagination.total > 0 && (
              <span className="ml-2 text-lg text-ink-soft">
                ({reviews.data.pagination.total})
              </span>
            )}
          </h2>

          {reviews.isPending ? (
            <Spinner />
          ) : reviews.isError ? (
            <ErrorState error={reviews.error} />
          ) : reviews.data.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-soft">
              還沒有評價。購買並收到商品後，就可以在會員中心留下評價。
            </p>
          ) : (
            <ul className="space-y-2.5">
              {reviews.data.items.map((review) => (
                <li
                  key={review.id}
                  className="flex items-center gap-4 rounded-[20px] bg-white px-5 py-3 shadow-[0_0_5px_rgba(0,0,0,0.1)]"
                >
                  <div className="flex w-32 shrink-0 items-center gap-2.5">
                    <img
                      src="/images/person.png"
                      alt=""
                      className="size-10 rounded-full bg-taupe-100 p-1.5"
                    />
                    <span className="text-sm font-bold">{review.authorName}</span>
                  </div>
                  <p className="flex-1 text-sm text-ink-soft">{review.body || '（未留言）'}</p>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StarRating rating={review.rating} />
                    <time className="text-xs text-ink-faint" dateTime={review.createdAt}>
                      {formatDate(review.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {related.data && related.data.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl">你可能也喜歡</h2>
          <div className="mt-6 grid grid-cols-3 gap-4 sm:gap-6">
            {related.data.map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.id}`}
                className="surface group overflow-hidden p-4 text-center"
              >
                <div className="aspect-square overflow-hidden rounded-[5px] bg-taupe-100">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-3 text-sm group-hover:underline">{item.name}</p>
                <p className="mt-1 text-sm text-ink-soft">{formatPrice(item.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
