import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/format';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  totalStock?: number;
}

/**
 * Matches the original storefront tile: a rounded square image with the name
 * and price stacked below, no card chrome.
 */
export function ProductCard({ id, name, price, imageUrl, totalStock }: ProductCardProps) {
  const soldOut = totalStock !== undefined && totalStock <= 0;

  return (
    <Link to={`/product/${id}`} className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-[5px] bg-taupe-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-ink-faint">
            尚無圖片
          </div>
        )}
        {soldOut && (
          <span className="absolute top-3 left-3 rounded-full bg-black/80 px-2.5 py-1 text-xs text-white">
            售完
          </span>
        )}
      </div>
      <h3 className="mt-2.5 text-[15px] text-ink group-hover:underline">{name}</h3>
      <p className="mt-1 mb-2 text-[15px] text-ink-soft">{formatPrice(price)}</p>
    </Link>
  );
}
