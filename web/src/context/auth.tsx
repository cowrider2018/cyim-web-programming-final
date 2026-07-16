import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '../lib/api';
import type { User } from '../lib/types';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name: string;
  phone: string;
  address: string;
  birthDate: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const { user } = await api.get<{ user: User }>('/auth/me');
        return user;
      } catch (error) {
        // A signed-out visitor is an expected state, not a failure.
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => api.post<{ user: User }>('/auth/login', input),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(['auth', 'me'], user);
      // The cart is per-user, so anything cached for the previous visitor is stale.
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => api.post<{ user: User }>('/auth/register', input),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(['auth', 'me'], user);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.removeQueries({ queryKey: ['cart'] });
      queryClient.removeQueries({ queryKey: ['orders'] });
      queryClient.removeQueries({ queryKey: ['admin'] });
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAdmin: user?.role === 'admin',
      login: async (input) => (await loginMutation.mutateAsync(input)).user,
      register: async (input) => (await registerMutation.mutateAsync(input)).user,
      logout: () => logoutMutation.mutateAsync(),
    }),
    [user, isLoading, loginMutation, registerMutation, logoutMutation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
