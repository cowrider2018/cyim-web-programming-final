import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <p className="text-7xl italic text-stone-300">404</p>
      <h1 className="mt-4 text-3xl italic">找不到這個頁面</h1>
      <p className="mt-2 text-sm text-ink-soft">
        這個網址可能已經失效，或是被移動到別的地方了。
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-primary">
          回到首頁
        </Link>
        <Link to="/store" className="btn-outline">
          前往商店
        </Link>
      </div>
    </div>
  );
}
