import type { OrderStatus, PaymentMethod } from './types';

// TWD is a zero-decimal currency, matching how prices are stored. The symbol is
// written out rather than taken from Intl's currency style, which renders a bare
// "$" in zh-TW and reads as USD.
const number = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 });

export function formatPrice(amount: number): string {
  return `NT$${number.format(amount)}`;
}

const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** SQLite returns "YYYY-MM-DD HH:MM:SS" in UTC, which needs a nudge to parse. */
function toDate(value: string): Date {
  return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
}

export function formatDate(value: string): string {
  return dateFormatter.format(toDate(value));
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(toDate(value));
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已出貨',
  completed: '已完成',
  cancelled: '已取消',
};

export const orderStatusStyles: Record<OrderStatus, string> = {
  pending: 'bg-[#f3ead9] text-[#8a6a32]',
  paid: 'bg-[#e6ede9] text-[#3f6b57]',
  shipped: 'bg-[#e9e6f0] text-[#5b4f74]',
  completed: 'bg-ink text-cream',
  cancelled: 'bg-stone-200 text-ink-soft',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  credit_card: '信用卡',
  cash_on_delivery: '貨到付款',
};
