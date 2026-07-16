import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useCart } from '../hooks/use-cart';
import { useCategories } from '../hooks/use-catalog';

function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { data: cart } = useCart();
  const { data: categories } = useCategories();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname, location.search]);

  // Close the category dropdown on an outside click, the way a hover menu
  // would close when the pointer leaves it.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    if (!term) return;
    navigate(`/store?q=${encodeURIComponent(term)}`);
    setSearch('');
  }

  const cartCount = cart?.itemCount ?? 0;

  return (
    <header className="bg-white">
      <div className="mx-auto flex w-[92%] max-w-6xl items-center justify-between gap-4 py-4">
        <Link to="/" className="brand text-3xl text-ink sm:text-[38px]">
          Maisie
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          <form onSubmit={handleSearch} role="search" className="search-box">
            <button type="submit" aria-label="搜尋" className="p-2">
              <img src="/images/search.png" alt="" className="size-4" />
            </button>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent py-2 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint"
            />
          </form>

          <nav className="flex items-center gap-5" aria-label="主選單">
            <NavLink to="/about" className="nav-item">
              ABOUT US
            </NavLink>

            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                type="button"
                className="nav-item"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                onClick={() => setDropdownOpen((open) => !open)}
              >
                商品分類
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 top-full z-20 min-w-40 bg-cream shadow-[0px_8px_16px_rgba(0,0,0,0.4)]">
                  <Link to="/store" className="block px-4 py-3 text-sm hover:bg-taupe-300">
                    All Products
                  </Link>
                  {categories?.map((category) => (
                    <Link
                      key={category.slug}
                      to={`/store?category=${category.slug}`}
                      className="block px-4 py-3 text-sm hover:bg-taupe-300"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <NavLink to="/cart" className="nav-item">
              購物車{cartCount > 0 && `（${cartCount}）`}
            </NavLink>

            {isAdmin && (
              <NavLink to="/admin" className="nav-item">
                後台
              </NavLink>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/account" className="btn-dark">
                  {user.name}
                </Link>
                <button type="button" onClick={() => logout()} className="btn-link">
                  登出
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-dark">
                會員中心
              </Link>
            )}
          </nav>
        </div>

        <button
          type="button"
          className="btn-link lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">選單</span>
          <svg viewBox="0 0 24 24" aria-hidden className="size-6">
            <path
              d={menuOpen ? 'M5 5l14 14M19 5L5 19' : 'M4 7h16M4 12h16M4 17h16'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-taupe-200 lg:hidden">
          <nav className="mx-auto flex w-[92%] max-w-6xl flex-col gap-1 py-3">
            <form onSubmit={handleSearch} role="search" className="search-box mb-2">
              <button type="submit" aria-label="搜尋" className="p-2">
                <img src="/images/search.png" alt="" className="size-4" />
              </button>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent py-2 pr-3 text-sm outline-none"
              />
            </form>
            <Link to="/about" className="py-2 text-sm">
              ABOUT US
            </Link>
            <Link to="/store" className="py-2 text-sm">
              全部商品
            </Link>
            {categories?.map((category) => (
              <Link
                key={category.slug}
                to={`/store?category=${category.slug}`}
                className="py-2 pl-4 text-sm text-ink-soft"
              >
                {category.name}
              </Link>
            ))}
            <Link to="/cart" className="py-2 text-sm">
              購物車{cartCount > 0 && `（${cartCount}）`}
            </Link>
            <div className="mt-2 border-t border-taupe-200 pt-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="block py-2 text-sm">
                      後台管理
                    </Link>
                  )}
                  <Link to="/account" className="block py-2 text-sm">
                    會員中心
                  </Link>
                  <button type="button" onClick={() => logout()} className="py-2 text-sm">
                    登出
                  </button>
                </>
              ) : (
                <Link to="/login" className="block py-2 text-sm">
                  會員中心 / 登入
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
    <footer className="mt-16 bg-white">
      <div className="mx-auto flex w-[90%] max-w-6xl flex-col justify-between gap-10 py-10 sm:flex-row">
        <div className="flex items-center">
          <p className="brand text-[30px] text-ink">Maisie</p>
        </div>

        <div className="flex gap-5">
          <div>
            <Link to="/about">
              <h2 className="brand mb-3 text-xl">CONTACT US</h2>
            </Link>
            <div className="flex flex-col gap-2.5 text-[15px]">
              <div className="flex items-center gap-2.5">
                <img src="/images/ins.png" alt="" className="size-5" />
                <span>Maisie_Accessories</span>
              </div>
              <div className="flex items-center gap-2.5">
                <img src="/images/phone.png" alt="" className="size-5" />
                <a href="tel:0800000000">0800-000-000</a>
              </div>
              <div className="flex items-center gap-2.5">
                <img src="/images/email.png" alt="" className="size-5" />
                <a href="mailto:MaisieAccessories@gmail.com">MaisieAccessories@gmail.com</a>
              </div>
              <div className="flex items-center gap-2.5">
                <img src="/images/map.png" alt="" className="size-5" />
                <a
                  href="https://maps.app.goo.gl/SV7Erzre8KS6aKP39"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  桃園市中壢區中北路200號
                </a>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="brand mb-3 text-xl">SERVICE</h2>
          <div className="flex flex-col gap-2.5 text-[15px]">
            <span>飾品保養</span>
            <span>付款與配送</span>
            <span>退換貨說明</span>
          </div>
        </div>
      </div>

      <div className="border-t border-taupe-200">
        <p className="mx-auto w-[90%] max-w-6xl py-4 text-xs text-ink-faint">
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
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-black focus:px-4 focus:py-2 focus:text-white"
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
