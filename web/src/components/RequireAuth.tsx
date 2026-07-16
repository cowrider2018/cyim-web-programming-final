import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { Spinner } from './ui';

/**
 * Route guard. This is a convenience for the visitor, not a security boundary —
 * every protected endpoint is independently authorised on the server.
 */
export function RequireAuth({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  // Redirecting before /auth/me resolves would bounce signed-in users on reload.
  if (isLoading) return <Spinner label="驗證中" />;

  if (!user) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
