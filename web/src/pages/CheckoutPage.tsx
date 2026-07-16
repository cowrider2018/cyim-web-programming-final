import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FormError, Spinner } from '../components/ui';
import { useAuth } from '../context/auth';
import { useCart } from '../hooks/use-cart';
import { useCheckout } from '../hooks/use-orders';
import { ApiError } from '../lib/api';
import { formatPrice, paymentMethodLabels } from '../lib/format';
import type { PaymentMethod } from '../lib/types';

export function CheckoutPage() {
  const { user } = useAuth();
  const cart = useCart();
  const checkout = useCheckout();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [form, setForm] = useState({
    recipientName: user?.name ?? '',
    recipientPhone: user?.phone ?? '',
    shippingAddress: user?.address ?? '',
    cardNumber: '',
    notes: '',
  });

  const data = cart.data;

  if (cart.isPending || !data) return <Spinner />;
  if (data.items.length === 0 && !checkout.isSuccess) {
    return <Navigate to="/cart" replace />;
  }

  const fieldErrors = checkout.error instanceof ApiError ? checkout.error.fieldErrors : {};

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await checkout.mutateAsync({
      paymentMethod,
      recipientName: form.recipientName,
      recipientPhone: form.recipientPhone,
      shippingAddress: form.shippingAddress,
      ...(paymentMethod === 'credit_card' ? { cardNumber: form.cardNumber } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    });
    navigate(`/orders/${result.orderId}?placed=1`, { replace: true });
  }

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  return (
    <div className="mx-auto w-[90%] max-w-5xl py-10">
      <h1 className="pb-8 text-3xl font-bold italic">結帳</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="surface p-6">
            <h2 className="text-2xl">配送資訊</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="recipientName" className="label">
                  收件人姓名
                </label>
                <input
                  id="recipientName"
                  className="input"
                  required
                  value={form.recipientName}
                  onChange={(event) => update('recipientName', event.target.value)}
                />
                {fieldErrors.recipientName && (
                  <p className="field-error">{fieldErrors.recipientName}</p>
                )}
              </div>

              <div>
                <label htmlFor="recipientPhone" className="label">
                  聯絡電話
                </label>
                <input
                  id="recipientPhone"
                  className="input"
                  required
                  inputMode="numeric"
                  placeholder="0912345678"
                  value={form.recipientPhone}
                  onChange={(event) => update('recipientPhone', event.target.value)}
                />
                {fieldErrors.recipientPhone && (
                  <p className="field-error">{fieldErrors.recipientPhone}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="shippingAddress" className="label">
                  配送地址
                </label>
                <input
                  id="shippingAddress"
                  className="input"
                  required
                  value={form.shippingAddress}
                  onChange={(event) => update('shippingAddress', event.target.value)}
                />
                {fieldErrors.shippingAddress && (
                  <p className="field-error">{fieldErrors.shippingAddress}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="notes" className="label">
                  訂單備註（選填）
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  className="input resize-none"
                  value={form.notes}
                  onChange={(event) => update('notes', event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="surface p-6">
            <h2 className="text-2xl">付款方式</h2>
            <fieldset className="mt-5">
              <legend className="sr-only">選擇付款方式</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                      paymentMethod === method
                        ? 'border-taupe-500 bg-taupe-100'
                        : 'border-taupe-300 hover:border-taupe-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="accent-taupe-500"
                    />
                    <span className="text-sm">{paymentMethodLabels[method]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {paymentMethod === 'credit_card' && (
              <div className="mt-5">
                <label htmlFor="cardNumber" className="label">
                  信用卡卡號
                </label>
                <input
                  id="cardNumber"
                  className="input"
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4111 1111 1111 1111"
                  value={form.cardNumber}
                  onChange={(event) => update('cardNumber', event.target.value)}
                />
                {fieldErrors.cardNumber && (
                  <p className="field-error">{fieldErrors.cardNumber}</p>
                )}
                <p className="mt-2 text-xs text-ink-faint">
                  這是示範專案，不會真的請款。系統只會保存卡號後四碼。
                </p>
              </div>
            )}
          </section>

          <FormError error={checkout.error} />
        </div>

        <aside className="h-fit lg:sticky lg:top-6">
          <div className="surface p-6">
            <h2 className="text-2xl">訂單摘要</h2>

            <ul className="mt-5 space-y-3">
              {data.items.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-[5px] bg-taupe-100">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.productName}</p>
                    <p className="text-xs text-ink-faint">
                      {item.variantName} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm text-ink-soft">{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-taupe-300 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">小計</dt>
                <dd>{formatPrice(data.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">運費</dt>
                <dd>{data.shippingFee === 0 ? '免運' : formatPrice(data.shippingFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-taupe-300 pt-2 text-lg">
                <dt className="font-medium">應付金額</dt>
                <dd className="font-bold">{formatPrice(data.total)}</dd>
              </div>
            </dl>

            <button
              type="submit"
              disabled={checkout.isPending}
              className="btn-taupe mt-6 w-full py-3"
            >
              {checkout.isPending ? '送出中…' : '確認送出訂單'}
            </button>
            <Link to="/cart" className="btn-link mt-2 w-full">
              返回購物車
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}
