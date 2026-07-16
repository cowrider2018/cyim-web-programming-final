import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FormError } from '../components/ui';
import { useAuth } from '../context/auth';
import { ApiError } from '../lib/api';
import { asset } from '../lib/asset';

type Mode = 'login' | 'register';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/account';

  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    birthDate: '',
  });

  if (user) return <Navigate to={from} replace />;

  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {};
  const isRegister = mode === 'register';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register({
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone,
          address: form.address,
          birthDate: form.birthDate,
        });
      }
      navigate(from, { replace: true });
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-0 px-5 py-12 lg:grid-cols-2 lg:gap-12">
      <div className="hidden overflow-hidden rounded-[var(--radius-lg)] lg:block">
        <img src={asset('/images/log.jpg')} alt="" className="size-full object-cover" />
      </div>

      <div className="flex items-center">
        <div className="w-full max-w-md lg:mx-auto">
          <div className="text-center">
            <p className="eyebrow">Members</p>
            <h1 className="mt-2 font-display text-5xl font-semibold text-ink">
              {isRegister ? '建立帳號' : '歡迎回來'}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              {isRegister ? '註冊後即可購物、追蹤訂單並留下評價。' : '登入以檢視購物車與訂單。'}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 rounded-full border border-line-strong p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded-full py-2 text-sm transition-colors ${
                mode === 'login' ? 'bg-ink text-cream' : 'text-ink-soft'
              }`}
            >
              登入
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`rounded-full py-2 text-sm transition-colors ${
                mode === 'register' ? 'bg-ink text-cream' : 'text-ink-soft'
              }`}
            >
              註冊
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <>
                <div>
                  <label htmlFor="name" className="label">
                    姓名
                  </label>
                  <input
                    id="name"
                    className="input"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                  />
                  {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="birthDate" className="label">
                      生日
                    </label>
                    <input
                      id="birthDate"
                      type="date"
                      className="input"
                      required
                      value={form.birthDate}
                      onChange={(event) => update('birthDate', event.target.value)}
                    />
                    {fieldErrors.birthDate && (
                      <p className="field-error">{fieldErrors.birthDate}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="label">
                      行動電話
                    </label>
                    <input
                      id="phone"
                      className="input"
                      required
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="0912345678"
                      value={form.phone}
                      onChange={(event) => update('phone', event.target.value)}
                    />
                    {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="label">
                    地址
                  </label>
                  <input
                    id="address"
                    className="input"
                    required
                    autoComplete="street-address"
                    value={form.address}
                    onChange={(event) => update('address', event.target.value)}
                  />
                  {fieldErrors.address && <p className="field-error">{fieldErrors.address}</p>}
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                required
                autoComplete="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
              />
              {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">
                密碼
              </label>
              <input
                id="password"
                type="password"
                className="input"
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
              />
              {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
              {isRegister && !fieldErrors.password && (
                <p className="mt-1.5 text-xs text-ink-faint">密碼至少 8 個字元</p>
              )}
            </div>

            <FormError error={error} />

            <button type="submit" disabled={pending} className="btn-primary w-full py-3.5">
              {pending ? '處理中⋯' : isRegister ? '註冊' : '登入'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-6 rounded-[var(--radius)] border border-line bg-surface-2 p-4 text-xs text-ink-soft">
              <p className="font-medium text-ink">示範帳號</p>
              <p className="mt-1.5">顧客：asd1234@gmail.com / password1234</p>
              <p>店長：admin@maisie.tw / admin1234</p>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-ink-faint">
            <Link to="/" className="hover:text-ink">
              ← 回到首頁
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
