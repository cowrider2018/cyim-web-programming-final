import type { ReactNode } from 'react';
import { ApiError } from '../lib/api';
import type { OrderStatus } from '../lib/types';
import { orderStatusLabels, orderStatusStyles } from '../lib/format';
import { ChevronLeft, ChevronRight, StarIcon } from './icons';

export function Spinner({ label = '載入中' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-faint">
      <span
        className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-gold"
        aria-hidden
      />
      <span className="text-sm">{label}⋯</span>
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
    <div role="alert" className="surface flex flex-col items-center gap-3 p-12 text-center">
      <p className="font-display text-3xl text-ink">載入失敗</p>
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
    <div className="surface flex flex-col items-center gap-3 p-14 text-center">
      <p className="font-display text-3xl text-ink">{title}</p>
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
    <p
      role="alert"
      className="rounded-[var(--radius)] border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
    >
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
  const starSize = size === 'md' ? 18 : 14;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex text-gold"
        role="img"
        aria-label={rating === null ? '尚無評分' : `評分 ${value} / 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} size={starSize} filled={star <= Math.round(value)} />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-ink-faint">
          {count > 0 ? `${value}（${count}）` : '尚無評價'}
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
    <nav className="flex items-center justify-center gap-4 pt-12" aria-label="分頁">
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line-strong"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="上一頁"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-16 text-center text-sm tracking-wide text-ink-soft">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line-strong"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="下一頁"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}

/** Section header with a gold eyebrow, used across storefront pages. */
export function SectionHeading({
  eyebrow,
  title,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-2 font-display text-4xl font-semibold text-ink">{title}</h2>
    </div>
  );
}
