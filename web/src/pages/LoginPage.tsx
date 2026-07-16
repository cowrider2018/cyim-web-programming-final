import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FormError } from '../components/ui';
import { useAuth } from '../context/auth';
import { ApiError } from '../lib/api';

type Mode = 'login' | 'register';

interface LocationState {
  from?: string;
}

/** Light-grey field with a leading icon, matching the original login form. */
function Field({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="my-3.5 flex items-center rounded-md bg-[#f3f1ef]">
      <span className="ml-4 text-ink-faint">{icon}</span>
      {children}
    </div>
  );
}

const icons = {
  user: '👤',
  calendar: '📅',
  phone: '📞',
  map: '📍',
  mail: '✉️',
  lock: '🔒',
};

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

  const inputClass = 'w-full border-0 bg-transparent p-4 text-sm outline-none';

  return (
    <div className="flex items-center justify-center bg-page px-4 py-10">
      <div className="flex w-full max-w-5xl overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.1)]">
        <img
          src="/images/log.jpg"
          alt=""
          className="hidden w-1/2 object-cover md:block"
        />

        <div className="flex w-full items-center justify-center bg-taupe-200 md:w-3/5">
          <div className="w-full px-8 py-10 text-center sm:px-12">
            <h1 className="relative mb-12 inline-block text-3xl">
              {isRegister ? '註冊' : '登入'}
              <span className="absolute -bottom-3 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-ink" />
            </h1>

            <form onSubmit={handleSubmit} className="text-left">
              {isRegister && (
                <>
                  <Field icon={icons.user}>
                    <input
                      id="name"
                      aria-label="姓名"
                      className={inputClass}
                      required
                      placeholder="姓名"
                      autoComplete="name"
                      value={form.name}
                      onChange={(event) => update('name', event.target.value)}
                    />
                  </Field>
                  {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}

                  <Field icon={icons.calendar}>
                    <input
                      id="birthDate"
                      aria-label="生日"
                      type="date"
                      className={inputClass}
                      required
                      value={form.birthDate}
                      onChange={(event) => update('birthDate', event.target.value)}
                    />
                  </Field>
                  {fieldErrors.birthDate && (
                    <p className="field-error">{fieldErrors.birthDate}</p>
                  )}

                  <Field icon={icons.map}>
                    <input
                      id="address"
                      aria-label="地址"
                      className={inputClass}
                      required
                      placeholder="地址"
                      autoComplete="street-address"
                      value={form.address}
                      onChange={(event) => update('address', event.target.value)}
                    />
                  </Field>
                  {fieldErrors.address && <p className="field-error">{fieldErrors.address}</p>}

                  <Field icon={icons.phone}>
                    <input
                      id="phone"
                      aria-label="行動電話"
                      className={inputClass}
                      required
                      placeholder="行動電話 0912345678"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) => update('phone', event.target.value)}
                    />
                  </Field>
                  {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
                </>
              )}

              <Field icon={icons.mail}>
                <input
                  id="email"
                  aria-label="Email"
                  type="email"
                  className={inputClass}
                  required
                  placeholder="Email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                />
              </Field>
              {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}

              <Field icon={icons.lock}>
                <input
                  id="password"
                  aria-label="密碼"
                  type="password"
                  className={inputClass}
                  required
                  placeholder="密碼"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                />
              </Field>
              {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
              {isRegister && !fieldErrors.password && (
                <p className="mt-1 text-xs text-ink-faint">密碼至少 8 個字元</p>
              )}

              <div className="mt-4">
                <FormError error={error} />
              </div>

              {/* Two buttons: the active mode submits, the other switches mode. */}
              <div className="flex justify-between gap-3 pt-5">
                <button
                  type={mode === 'login' ? 'submit' : 'button'}
                  onClick={mode === 'login' ? undefined : () => setMode('login')}
                  disabled={pending}
                  className={`h-10 flex-1 rounded-[20px] border-0 text-sm transition-colors ${
                    mode === 'login'
                      ? 'bg-black text-white'
                      : 'bg-[#eaeaea] text-[#555]'
                  }`}
                >
                  登入
                </button>
                <button
                  type={mode === 'register' ? 'submit' : 'button'}
                  onClick={mode === 'register' ? undefined : () => setMode('register')}
                  disabled={pending}
                  className={`h-10 flex-1 rounded-[20px] border-0 text-sm transition-colors ${
                    mode === 'register'
                      ? 'bg-black text-white'
                      : 'bg-[#eaeaea] text-[#555]'
                  }`}
                >
                  註冊
                </button>
              </div>
            </form>

            {mode === 'login' && (
              <div className="mt-6 rounded-md bg-white/60 p-4 text-left text-xs text-ink-soft">
                <p className="font-medium">示範帳號</p>
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
    </div>
  );
}
