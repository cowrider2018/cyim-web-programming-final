import type { ReactNode } from 'react';
import { ApiError } from '../lib/api';
import type { OrderStatus } from '../lib/types';
import { orderStatusLabels, orderStatusStyles } from '../lib/format';

export function Spinner({ label = '載入中' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-faint">
      <span
        className="size-5 animate-spin rounded-full border-2 border-taupe-300 border-t-taupe-500"
        aria-hidden
      />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : '發生未知的錯誤';

  return (
    <div role="alert" className="surface flex flex-col items-center gap-3 p-10 text-center">
      <p className="text-2xl font-bold italic text-ink">載入失敗</p>
      <p className="text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline mt-2">
          重新載入
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center gap-3 p-12 text-center">
      <p className="text-2xl font-bold italic text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-soft">{description}</p>}
      {action}
    </div>
  );
}

/** Inline form-level error, e.g. "only 3 left in stock". */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof ApiError ? error.message : '發生錯誤，請稍後再試';
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${orderStatusStyles[status]}`}
    >
      {orderStatusLabels[status]}
    </span>
  );
}

/** Gold stars, echoing the original review board. */
export function StarRating({
  rating,
  count,
  size = 'sm',
}: {
  rating: number | null;
  count?: number;
  size?: 'sm' | 'md';
}) {
  const value = rating ?? 0;
  const starSize = size === 'md' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex ${starSize} leading-none`}
        role="img"
        aria-label={rating === null ? '尚無評分' : `評分 ${value} / 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            aria-hidden
            className={star <= Math.round(value) ? 'text-[gold]' : 'text-taupe-300'}
          >
            ★
          </span>
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-ink-faint">
          {count > 0 ? `${value} (${count})` : '尚無評價'}
        </span>
      )}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2 pt-8" aria-label="分頁">
      <button
        type="button"
        className="btn-outline"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        上一頁
      </button>
      <span className="px-3 text-sm text-ink-soft">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        className="btn-outline"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        下一頁
      </button>
    </nav>
  );
}
