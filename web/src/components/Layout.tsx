import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useCart } from '../hooks/use-cart';
import { useCategories } from '../hooks/use-catalog';
import {
  CartIcon,
  CloseIcon,
  InstagramIcon,
  MailIcon,
  MenuIcon,
  PhoneIcon,
  PinIcon,
  SearchIcon,
  UserIcon,
} from './icons';

function CartButton() {
  const { data: cart } = useCart();
  const count = cart?.itemCount ?? 0;
  const [bump, setBump] = useState(false);
  const previous = useRef(count);

  // Pulse the badge whenever the item count grows.
  useEffect(() => {
    if (count > previous.current) {
      setBump(true);
      const timer = window.setTimeout(() => setBump(false), 420);
      return () => window.clearTimeout(timer);
    }
    previous.current = count;
    return undefined;
  }, [count]);

  useEffect(() => {
    previous.current = count;
  }, [count]);

  return (
    <Link
      to="/cart"
      className="relative p-1.5 text-ink transition-colors hover:text-gold"
      aria-label={`購物車，${count} 件商品`}
    >
      <CartIcon size={21} />
      {count > 0 && (
        <span
          className={`absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-white ${
            bump ? 'badge-bump' : ''
          }`}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}

function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { data: categories } = useCategories();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    if (!term) return;
    navigate(`/store?q=${encodeURIComponent(term)}`);
    setSearch('');
    setSearchOpen(false);
  }

  // NavLink matches on pathname only, so every /store?category=… link would
  // read as active at once. Derive the active item from the query instead.
  const params = new URLSearchParams(location.search);
  const activeCategory = params.get('category');
  const isStore = location.pathname === '/store';

  const navLinks = [
    {
      to: '/store',
      label: '全部商品',
      active: isStore && !activeCategory && !params.get('q'),
    },
    ...(categories ?? []).map((category) => ({
      to: `/store?category=${category.slug}`,
      label: category.name,
      active: isStore && activeCategory === category.slug,
    })),
    { to: '/about', label: '關於', active: location.pathname === '/about' },
  ];

  const navLinkClass = (active: boolean) =>
    `link-underline text-[13px] tracking-wide transition-colors hover:text-ink ${
      active ? 'is-active text-ink' : 'text-ink-soft'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-5">
        <button
          type="button"
          className="p-1 text-ink lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">選單</span>
          {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>

        <Link
          to="/"
          className="font-display text-[30px] leading-none font-semibold tracking-wide text-ink lg:text-[34px]"
        >
          Maisie
        </Link>

        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label="主選單"
        >
          {navLinks.map((link) => (
            <Link key={link.label} to={link.to} className={navLinkClass(link.active)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className="p-1.5 text-ink transition-colors hover:text-gold"
            aria-label="搜尋"
            aria-expanded={searchOpen}
          >
            <SearchIcon size={21} />
          </button>

          <CartButton />

          {user ? (
            <div className="hidden items-center gap-3 lg:flex">
              {isAdmin && (
                <Link to="/admin" className="text-[13px] text-ink-soft hover:text-ink">
                  後台
                </Link>
              )}
              <Link
                to="/account"
                className="flex items-center gap-1.5 text-[13px] text-ink hover:text-gold"
              >
                <UserIcon size={20} />
                {user.name}
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="text-[13px] text-ink-faint hover:text-ink"
              >
                登出
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden p-1.5 text-ink transition-colors hover:text-gold lg:block"
              aria-label="會員登入"
            >
              <UserIcon size={21} />
            </Link>
          )}
        </div>
      </div>

      {/* Expanding search row */}
      <div
        className={`overflow-hidden border-line transition-[max-height,opacity] duration-300 ${
          searchOpen ? 'max-h-24 border-t opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <form
          onSubmit={handleSearch}
          role="search"
          className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4"
        >
          <SearchIcon size={20} />
          <input
            ref={searchInput}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜尋商品⋯"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
            aria-label="搜尋商品"
          />
          <button type="submit" className="btn-ghost text-[13px]">
            搜尋
          </button>
        </form>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div id="mobile-menu" className="border-t border-line bg-cream lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="border-b border-line py-3 text-sm text-ink"
              >
                {link.label}
              </Link>
            ))}
            <div className="py-3">
              {user ? (
                <div className="flex flex-col gap-3">
                  {isAdmin && (
                    <Link to="/admin" className="text-sm text-ink">
                      後台管理
                    </Link>
                  )}
                  <Link to="/account" className="text-sm text-ink">
                    會員中心
                  </Link>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-left text-sm text-ink-soft"
                  >
                    登出
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-sm text-ink">
                  會員登入 / 註冊
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl font-semibold text-ink">Maisie</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              手作感輕珠寶選物，讓日常穿搭多一點細節。單戴俐落，疊戴有層次。
            </p>
          </div>

          <div>
            <h2 className="eyebrow">Contact</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li className="flex items-center gap-2.5">
                <InstagramIcon size={17} />
                Maisie_Accessories
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneIcon size={17} />
                <a href="tel:0800000000" className="hover:text-ink">
                  0800-000-000
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MailIcon size={17} />
                <a href="mailto:MaisieAccessories@gmail.com" className="hover:text-ink">
                  MaisieAccessories@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <PinIcon size={17} />
                <a
                  href="https://maps.app.goo.gl/SV7Erzre8KS6aKP39"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-ink"
                >
                  桃園市中壢區中北路200號
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="eyebrow">Service</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li>飾品保養</li>
              <li>付款與配送</li>
              <li>退換貨說明</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-ink-faint">
          © {new Date().getFullYear()} Maisie. 學習用專案，非真實商店。
        </p>
      </div>
    </footer>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-3 focus:rounded-[var(--radius)] focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
      >
        跳至主要內容
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
