import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/format';
import { StarRating } from './ui';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryName?: string;
  averageRating?: number | null;
  reviewCount?: number;
  totalStock?: number;
}

/**
 * Storefront tile: a square image that zooms and lifts on hover, with the
 * category, name, rating and gold-accented price stacked below.
 */
export function ProductCard({
  id,
  name,
  price,
  imageUrl,
  categoryName,
  averageRating,
  reviewCount,
  totalStock,
}: ProductCardProps) {
  const soldOut = totalStock !== undefined && totalStock <= 0;

  return (
    <Link to={`/product/${id}`} className="group flex flex-col">
      <div className="lift relative aspect-square overflow-hidden rounded-[var(--radius-lg)] border border-line bg-stone-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[900ms] ease-[var(--ease-out)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-ink-faint">
            尚無圖片
          </div>
        )}

        {soldOut && (
          <span className="absolute top-3 left-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] tracking-wide text-cream">
            售完
          </span>
        )}

        {/* Quick "view" affordance rising on hover. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-ink/85 py-2.5 text-center text-[11px] tracking-[0.2em] text-cream uppercase opacity-0 transition-all duration-400 ease-[var(--ease-out)] group-hover:translate-y-0 group-hover:opacity-100">
          查看商品
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        {categoryName && <span className="eyebrow text-ink-faint">{categoryName}</span>}
        <h3 className="text-sm leading-snug text-ink transition-colors group-hover:text-gold">
          {name}
        </h3>
        {reviewCount !== undefined && reviewCount > 0 && (
          <StarRating rating={averageRating ?? 0} count={reviewCount} />
        )}
        <p className="mt-0.5 font-display text-lg font-semibold text-ink">
          {formatPrice(price)}
        </p>
      </div>
    </Link>
  );
}
