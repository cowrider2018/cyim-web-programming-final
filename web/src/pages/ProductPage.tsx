import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailSkeleton } from '../components/Skeleton';
import { ErrorState, Spinner, StarRating } from '../components/ui';
import { ChevronLeft, ChevronRight, MinusIcon, PlusIcon } from '../components/icons';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/auth';
import { useAddToCart } from '../hooks/use-cart';
import { useProduct, useProductReviews, useRelatedProducts } from '../hooks/use-catalog';
import { ApiError } from '../lib/api';
import { formatDate, formatPrice } from '../lib/format';

export function ProductPage() {
  const { id } = useParams();
  const productId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const product = useProduct(productId);
  const related = useRelatedProducts(productId);
  const reviews = useProductReviews(productId);
  const addToCart = useAddToCart();

  const [variantId, setVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!product.data) return;
    const firstAvailable =
      product.data.variants.find((variant) => variant.stock > 0) ?? product.data.variants[0];
    setVariantId(firstAvailable?.id ?? null);
    setQuantity(1);
    setActiveImage(0);
  }, [product.data]);

  if (product.isPending) return <ProductDetailSkeleton />;
  if (product.isError) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <ErrorState error={product.error} onRetry={() => product.refetch()} />
      </div>
    );
  }

  const data = product.data;
  const selectedVariant = data.variants.find((variant) => variant.id === variantId) ?? null;
  const maxQuantity = Math.max(1, selectedVariant?.stock ?? 1);
  const soldOut = !selectedVariant || selectedVariant.stock === 0;
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
    try {
      await addToCart.mutateAsync({ variantId, quantity });
      toast(`已加入購物車 · ${data.name}`);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : '加入購物車失敗', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav aria-label="麵包屑" className="pb-8 text-xs tracking-wide text-ink-faint">
        <Link to="/store" className="hover:text-ink">
          全部商品
        </Link>
        <span className="px-2">/</span>
        <Link to={`/store?category=${data.category.slug}`} className="hover:text-ink">
          {data.category.name}
        </Link>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24">
          <div className="group relative aspect-square overflow-hidden rounded-[var(--radius-lg)] border border-line bg-stone-100">
            {data.images.length > 0 ? (
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

            {data.images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="上一張"
                  onClick={() => cycleImage(-1)}
                  className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/80 text-ink opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="下一張"
                  onClick={() => cycleImage(1)}
                  className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/80 text-ink opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {data.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {data.images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`檢視第 ${index + 1} 張圖片`}
                  aria-current={index === activeImage}
                  className={`size-20 overflow-hidden rounded-[var(--radius)] border transition-colors ${
                    index === activeImage ? 'border-ink' : 'border-line hover:border-line-strong'
                  }`}
                >
                  <img src={image.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="eyebrow">{data.category.nameEn}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
            {data.name}
          </h1>

          <div className="mt-4">
            <StarRating rating={data.averageRating} count={data.reviewCount} size="md" />
          </div>

          <p className="mt-6 font-display text-3xl font-semibold text-ink">
            {formatPrice(data.price)}
          </p>

          {data.description && (
            <p className="mt-6 leading-relaxed text-ink-soft">{data.description}</p>
          )}

          <div className="mt-8 h-px bg-line" />

          {multipleVariants ? (
            <fieldset className="mt-8">
              <legend className="label">規格</legend>
              <div className="flex flex-wrap gap-2.5">
                {data.variants.map((variant) => {
                  const disabled = variant.stock === 0;
                  const active = variant.id === variantId;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setVariantId(variant.id);
                        setQuantity(1);
                      }}
                      className={`rounded-[var(--radius)] border px-4 py-2 text-sm transition-colors ${
                        active
                          ? 'border-ink bg-ink text-cream'
                          : 'border-line-strong text-ink hover:border-ink'
                      } ${disabled ? 'cursor-not-allowed text-ink-faint line-through opacity-50' : ''}`}
                    >
                      {variant.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            selectedVariant &&
            selectedVariant.name !== '標準' && (
              <p className="mt-8 text-sm text-ink-soft">規格：{selectedVariant.name}</p>
            )
          )}

          <div className="mt-6">
            <span className="label">數量</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-full border border-line-strong">
                <button
                  type="button"
                  className="flex size-10 items-center justify-center text-ink disabled:opacity-30"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  aria-label="減少數量"
                >
                  <MinusIcon size={16} />
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
                  className="w-10 border-0 bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="數量"
                />
                <button
                  type="button"
                  className="flex size-10 items-center justify-center text-ink disabled:opacity-30"
                  onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                  disabled={quantity >= maxQuantity}
                  aria-label="增加數量"
                >
                  <PlusIcon size={16} />
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

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={soldOut || addToCart.isPending}
            className="btn-primary mt-8 w-full py-4"
          >
            {addToCart.isPending ? '加入中⋯' : soldOut ? '已售完' : '加入購物車'}
          </button>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-24">
        <div className="border-b border-line pb-4">
          <p className="eyebrow">Reviews</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
            商品評價
            {reviews.data && reviews.data.pagination.total > 0 && (
              <span className="ml-2 text-xl text-ink-faint">
                {reviews.data.pagination.total}
              </span>
            )}
          </h2>
        </div>

        <div className="mt-8">
          {reviews.isPending ? (
            <Spinner />
          ) : reviews.isError ? (
            <ErrorState error={reviews.error} />
          ) : reviews.data.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">
              還沒有評價。購買並收到商品後，就可以在會員中心留下評價。
            </p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {reviews.data.items.map((review) => (
                <li key={review.id} className="surface p-6">
                  <div className="flex items-center justify-between">
                    <StarRating rating={review.rating} />
                    <time className="text-xs text-ink-faint" dateTime={review.createdAt}>
                      {formatDate(review.createdAt)}
                    </time>
                  </div>
                  {review.body && (
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">{review.body}</p>
                  )}
                  <p className="mt-4 text-xs tracking-wide text-ink-faint">
                    — {review.authorName}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {related.data && related.data.length > 0 && (
        <section className="mt-24">
          <SectionRelated />
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {related.data.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                imageUrl={item.imageUrl}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionRelated() {
  return (
    <div className="border-b border-line pb-4">
      <p className="eyebrow">You May Also Like</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-ink">你可能也喜歡</h2>
    </div>
  );
}
