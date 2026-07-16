import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EmptyState,
  ErrorState,
  FormError,
  Pagination,
  Spinner,
  StarRating,
  StatusBadge,
} from '../components/ui';
import { StarIcon, TrashIcon } from '../components/icons';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/auth';
import {
  useCreateReview,
  useDeleteReview,
  useMyReviews,
  useOrders,
  useReviewableItems,
} from '../hooks/use-orders';
import { api } from '../lib/api';
import { formatDate, formatDateTime, formatPrice } from '../lib/format';
import type { ReviewableItem } from '../lib/types';

type Tab = 'profile' | 'orders' | 'reviews';

const tabs: { id: Tab; label: string }[] = [
  { id: 'profile', label: '個人資訊' },
  { id: 'orders', label: '訂單資訊' },
  { id: 'reviews', label: '歷史評論' },
];

export function AccountPage() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <section className="mx-auto max-w-4xl px-5 py-12">
      <header className="border-b border-line pb-6 text-center">
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 font-display text-5xl font-semibold">會員中心</h1>
      </header>

      <div className="mt-6 flex justify-center gap-8" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${
              tab === item.id
                ? 'border-gold text-ink'
                : 'border-transparent text-ink-faint hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="pt-10">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'reviews' && <ReviewsTab />}
      </div>
    </section>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const updateProfile = useMutation({
    mutationFn: (input: typeof profile) => api.patch('/auth/me', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast('個人資料已更新');
    },
    onError: () => toast('更新失敗，請稍後再試', 'error'),
  });

  const changePassword = useMutation({
    mutationFn: (input: typeof passwords) => api.post('/auth/me/password', input),
    onSuccess: () => {
      setPasswords({ currentPassword: '', newPassword: '' });
      toast('密碼已更新');
    },
  });

  if (!user) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="surface p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">個人資料</h2>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            updateProfile.mutate(profile);
          }}
        >
          <div>
            <label className="label" htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              className="input bg-stone-100 text-ink-faint"
              value={user.email}
              disabled
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-name">
              用戶名
            </label>
            <input
              id="profile-name"
              className="input"
              value={profile.name}
              onChange={(event) =>
                setProfile((previous) => ({ ...previous, name: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-phone">
              行動電話
            </label>
            <input
              id="profile-phone"
              className="input"
              value={profile.phone}
              onChange={(event) =>
                setProfile((previous) => ({ ...previous, phone: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-address">
              地址
            </label>
            <input
              id="profile-address"
              className="input"
              value={profile.address}
              onChange={(event) =>
                setProfile((previous) => ({ ...previous, address: event.target.value }))
              }
            />
          </div>

          <FormError error={updateProfile.error} />
          <button type="submit" disabled={updateProfile.isPending} className="btn-primary">
            {updateProfile.isPending ? '儲存中⋯' : '儲存變更'}
          </button>
        </form>
      </section>

      <section className="surface h-fit p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">變更密碼</h2>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            changePassword.mutate(passwords);
          }}
        >
          <div>
            <label className="label" htmlFor="current-password">
              目前密碼
            </label>
            <input
              id="current-password"
              type="password"
              className="input"
              required
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((previous) => ({ ...previous, currentPassword: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="new-password">
              新密碼
            </label>
            <input
              id="new-password"
              type="password"
              className="input"
              required
              minLength={8}
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((previous) => ({ ...previous, newPassword: event.target.value }))
              }
            />
            <p className="mt-1.5 text-xs text-ink-faint">至少 8 個字元</p>
          </div>

          <FormError error={changePassword.error} />
          <button type="submit" disabled={changePassword.isPending} className="btn-outline">
            {changePassword.isPending ? '更新中⋯' : '更新密碼'}
          </button>
        </form>

        <dl className="mt-6 space-y-1.5 border-t border-line pt-5 text-xs text-ink-faint">
          <div className="flex justify-between">
            <dt>會員編號</dt>
            <dd>#{user.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt>註冊日期</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
          {user.lastLoginAt && (
            <div className="flex justify-between">
              <dt>上次登入</dt>
              <dd>{formatDateTime(user.lastLoginAt)}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}

function OrdersTab() {
  const [page, setPage] = useState(1);
  const orders = useOrders(page);

  if (orders.isPending) return <Spinner />;
  if (orders.isError) return <ErrorState error={orders.error} onRetry={() => orders.refetch()} />;

  if (orders.data.items.length === 0) {
    return (
      <EmptyState
        title="還沒有訂單"
        description="下第一筆訂單後，紀錄會出現在這裡。"
        action={
          <Link to="/store" className="btn-primary mt-2">
            開始選購
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <ul className="space-y-4">
        {orders.data.items.map((order) => (
          <li key={order.id} className="surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <Link to={`/orders/${order.id}`} className="font-medium hover:text-gold">
                    訂單 #{order.id}
                  </Link>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  {formatDateTime(order.createdAt)} · 共 {order.itemCount} 件
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-semibold">
                  {formatPrice(order.totalPrice)}
                </p>
                <Link to={`/orders/${order.id}`} className="text-xs text-ink-soft hover:text-ink">
                  查看明細 →
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Pagination
        page={orders.data.pagination.page}
        totalPages={orders.data.pagination.totalPages}
        onChange={setPage}
      />
    </div>
  );
}

function ReviewsTab() {
  const reviewable = useReviewableItems();
  const myReviews = useMyReviews();
  const deleteReview = useDeleteReview();
  const { toast } = useToast();

  if (reviewable.isPending || myReviews.isPending) return <Spinner />;

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-display text-2xl font-semibold">待評價商品</h2>
        <p className="mt-1 text-sm text-ink-soft">商品出貨後即可留下評價。</p>
        <div className="mt-5">
          {reviewable.data && reviewable.data.length > 0 ? (
            <ul className="space-y-4">
              {reviewable.data.map((item) => (
                <ReviewForm key={`${item.orderId}-${item.variantId}`} item={item} />
              ))}
            </ul>
          ) : (
            <EmptyState title="沒有待評價的商品" description="等訂單出貨後，就能在這裡留下評價。" />
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">歷史評論</h2>
        <div className="mt-5">
          {myReviews.data && myReviews.data.length > 0 ? (
            <ul className="space-y-4">
              {myReviews.data.map((review) => (
                <li key={review.id} className="surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/product/${review.productId}`}
                        className="font-medium hover:text-gold"
                      >
                        {review.productName}
                      </Link>
                      <p className="text-xs text-ink-faint">{review.variantName}</p>
                      <div className="mt-2">
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    <div className="text-right">
                      <time className="text-xs text-ink-faint">{formatDate(review.createdAt)}</time>
                      <button
                        type="button"
                        onClick={() => {
                          deleteReview.mutate(review.id, {
                            onSuccess: () => toast('已刪除評論'),
                          });
                        }}
                        disabled={deleteReview.isPending}
                        className="mt-2 flex items-center gap-1 text-xs text-ink-faint hover:text-danger"
                      >
                        <TrashIcon size={14} /> 刪除
                      </button>
                    </div>
                  </div>
                  {review.body && (
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">{review.body}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="還沒有留下任何評論" />
          )}
        </div>
      </section>
    </div>
  );
}

function ReviewForm({ item }: { item: ReviewableItem }) {
  const createReview = useCreateReview();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState('');

  return (
    <li className="surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link to={`/product/${item.productId}`} className="font-medium hover:text-gold">
            {item.productName}
          </Link>
          <p className="text-xs text-ink-faint">
            {item.variantName} · 訂單 #{item.orderId}
          </p>
        </div>
        <time className="text-xs text-ink-faint">{formatDate(item.orderedAt)}</time>
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          createReview.mutate(
            { orderId: item.orderId, variantId: item.variantId, rating, body },
            { onSuccess: () => toast('感謝你的評價！') },
          );
        }}
      >
        <fieldset>
          <legend className="label">評分</legend>
          <div className="flex gap-1 text-gold" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                aria-label={`給 ${star} 星`}
                aria-pressed={rating === star}
                className="transition-transform hover:scale-110"
              >
                <StarIcon size={26} filled={star <= (hover || rating)} />
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor={`review-${item.orderId}-${item.variantId}`}>
            評價內容（選填）
          </label>
          <textarea
            id={`review-${item.orderId}-${item.variantId}`}
            rows={2}
            maxLength={1000}
            className="input resize-none"
            placeholder="分享你的配戴心得⋯"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>

        <FormError error={createReview.error} />
        <button type="submit" disabled={createReview.isPending} className="btn-primary">
          {createReview.isPending ? '送出中⋯' : '送出評價'}
        </button>
      </form>
    </li>
  );
}
