import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: '總覽', end: true },
  { to: '/admin/products', label: '商品管理', end: false },
  { to: '/admin/orders', label: '訂單管理', end: false },
];

export function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="pb-6">
        <p className="text-xs tracking-[0.3em] text-ink-faint uppercase">Admin</p>
        <h1 className="mt-2 text-4xl text-ink">後台管理</h1>
      </header>

      <nav className="flex gap-1 border-b border-taupe-200" aria-label="後台選單">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-faint hover:text-ink'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="pt-8">
        <Outlet />
      </div>
    </div>
  );
}
