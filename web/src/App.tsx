import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { AboutPage } from './pages/AboutPage';
import { AccountPage } from './pages/AccountPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProductPage } from './pages/ProductPage';
import { StorePage } from './pages/StorePage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
        </Route>

        <Route element={<RequireAuth adminOnly />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
