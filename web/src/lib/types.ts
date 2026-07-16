export type UserRole = 'customer' | 'admin';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';

export type PaymentMethod = 'credit_card' | 'cash_on_delivery';

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  role: UserRole;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  nameEn: string;
  productCount: number;
}

export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  description: string;
  category: { id: number; slug: string; name: string; nameEn: string };
  imageUrl: string | null;
  totalStock: number;
  averageRating: number | null;
  reviewCount: number;
}

export interface Variant {
  id: number;
  name: string;
  stock: number;
  position: number;
}

export interface ProductDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  category: { id: number; slug: string; name: string; nameEn: string };
  averageRating: number | null;
  reviewCount: number;
  variants: Variant[];
  images: { id: number; url: string }[];
}

export interface RelatedProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
}

export interface CartLine {
  variantId: number;
  variantName: string;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  lineTotal: number;
  imageUrl: string | null;
}

export interface Cart {
  items: CartLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number;
  itemCount: number;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface OrderSummary {
  id: number;
  status: OrderStatus;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  cardLast4: string | null;
  createdAt: string;
  itemCount: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string | null;
  hasReview: boolean;
}

export interface OrderDetail {
  id: number;
  userId: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  cardLast4: string | null;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  subtotal: number;
  shippingFee: number;
  totalPrice: number;
  notes: string | null;
  createdAt: string;
  customerEmail: string;
  items: OrderItem[];
}

export interface AdminOrderSummary {
  id: number;
  status: OrderStatus;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  recipientName: string;
  shippingAddress: string;
  createdAt: string;
  customer: { id: number; name: string; email: string };
  itemCount: number;
}

export interface Review {
  id: number;
  rating: number;
  body: string;
  createdAt: string;
  authorName: string;
}

export interface MyReview {
  id: number;
  orderId: number;
  productId: number;
  rating: number;
  body: string;
  createdAt: string;
  productName: string;
  variantName: string;
}

export interface ReviewableItem {
  orderId: number;
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  orderedAt: string;
}

export interface AdminVariant {
  id: number;
  productId: number;
  name: string;
  stock: number;
  position: number;
}

export interface AdminProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  totalStock: number;
  variants: AdminVariant[];
}

export interface DashboardStats {
  totalRevenue: number;
  orderCount: number;
  customerCount: number;
  activeProductCount: number;
  ordersByStatus: { status: OrderStatus; total: number }[];
  lowStock: {
    variantId: number;
    productId: number;
    productName: string;
    variantName: string;
    stock: number;
  }[];
  topProducts: {
    productId: number;
    productName: string;
    unitsSold: number;
    revenue: number;
  }[];
}
