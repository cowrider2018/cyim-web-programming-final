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
    <section className="mx-auto flex w-[90%] max-w-4xl flex-col items-center py-10">
      <h1 className="text-4xl italic">會員中心</h1>

      <div className="mt-6 flex flex-wrap justify-center gap-4" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`btn-mute min-w-40 text-lg ${
              tab === item.id ? 'bg-mute-hover' : ''
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8 w-full">
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
  const [saved, setSaved] = useState<string | null>(null);

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
      setSaved('個人資料已更新');
      window.setTimeout(() => setSaved(null), 2500);
    },
  });

  const changePassword = useMutation({
    mutationFn: (input: typeof passwords) => api.post('/auth/me/password', input),
    onSuccess: () => {
      setPasswords({ currentPassword: '', newPassword: '' });
      setSaved('密碼已更新');
      window.setTimeout(() => setSaved(null), 2500);
    },
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-[30px] bg-white p-8 shadow-[0_5px_5px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-4">
          <img src="/images/person.png" alt="" className="size-16" />
          <h2 className="text-2xl">個人資料</h2>
        </div>

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
              className="input bg-taupe-100 text-ink-faint"
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
          <button type="submit" disabled={updateProfile.isPending} className="btn-dark">
            {updateProfile.isPending ? '儲存中…' : '儲存變更'}
          </button>
        </form>
      </section>

      <section className="rounded-[30px] bg-white p-8 shadow-[0_5px_5px_rgba(0,0,0,0.15)]">
        <h2 className="text-2xl">變更密碼</h2>
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
                setPasswords((previous) => ({
                  ...previous,
                  currentPassword: event.target.value,
                }))
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
                setPasswords((previous) => ({
                  ...previous,
                  newPassword: event.target.value,
                }))
              }
            />
            <p className="mt-1.5 text-xs text-ink-faint">至少 8 個字元</p>
          </div>

          <FormError error={changePassword.error} />
          <button type="submit" disabled={changePassword.isPending} className="btn-mute">
            {changePassword.isPending ? '更新中…' : '更新密碼'}
          </button>
        </form>

        <dl className="mt-6 space-y-1.5 border-t border-taupe-200 pt-5 text-xs text-ink-faint">
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

      {saved && (
        <p role="status" className="rounded-lg bg-taupe-100 px-3.5 py-2.5 text-sm text-ink">
          {saved}
        </p>
      )}
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
          <Link to="/store" className="btn-taupe mt-2">
            開始選購
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ul className="space-y-4">
        {orders.data.items.map((order) => (
          <li
            key={order.id}
            className="rounded-[20px] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <Link to={`/orders/${order.id}`} className="font-medium hover:underline">
                    訂單 #{order.id}
                  </Link>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  {formatDateTime(order.createdAt)} · 共 {order.itemCount} 件
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl">{formatPrice(order.totalPrice)}</p>
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

  if (reviewable.isPending || myReviews.isPending) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <section>
        <h2 className="text-2xl">待評價商品</h2>
        <p className="mt-1 text-sm text-ink-soft">商品出貨後即可留下評價。</p>
        <div className="mt-5">
          {reviewable.data && reviewable.data.length > 0 ? (
            <ul className="space-y-4">
              {reviewable.data.map((item) => (
                <ReviewForm key={`${item.orderId}-${item.variantId}`} item={item} />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="沒有待評價的商品"
              description="等訂單出貨後，就能在這裡留下評價。"
            />
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl">歷史評論</h2>
        <div className="mt-5">
          {myReviews.data && myReviews.data.length > 0 ? (
            <ul className="space-y-4">
              {myReviews.data.map((review) => (
                <li
                  key={review.id}
                  className="rounded-[20px] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/product/${review.productId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {review.productName}
                      </Link>
                      <p className="text-xs text-ink-faint">{review.variantName}</p>
                      <div className="mt-2">
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    <div className="text-right">
                      <time className="text-xs text-ink-faint">
                        {formatDate(review.createdAt)}
                      </time>
                      <button
                        type="button"
                        onClick={() => deleteReview.mutate(review.id)}
                        disabled={deleteReview.isPending}
                        className="mt-2 block text-xs text-ink-faint hover:text-red-700"
                      >
                        刪除
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
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');

  return (
    <li className="rounded-[20px] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link to={`/product/${item.productId}`} className="text-sm font-medium hover:underline">
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
          createReview.mutate({
            orderId: item.orderId,
            variantId: item.variantId,
            rating,
            body,
          });
        }}
      >
        <fieldset>
          <legend className="label">評分</legend>
          <div className="flex gap-1 text-3xl leading-none">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`給 ${star} 星`}
                aria-pressed={rating === star}
                className={star <= rating ? 'text-[gold]' : 'text-taupe-300 hover:text-taupe-400'}
              >
                ★
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
            placeholder="分享你的配戴心得…"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>

        <FormError error={createReview.error} />
        <button type="submit" disabled={createReview.isPending} className="btn-taupe">
          {createReview.isPending ? '送出中…' : '送出評價'}
        </button>
      </form>
    </li>
  );
}
