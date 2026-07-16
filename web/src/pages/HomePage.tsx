import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/format';

// The original home page hand-picked these marketing shots for the "New!"
// showcase; the tiles link through to the real product pages. Product ids
// follow the seed order (hottest category = ids 25–30).
const featuredRotation = [
  { img: '/images/top/n1.PNG', name: '甜酷戒指組合', price: 680, id: 25 },
  { img: '/images/top/n4.PNG', name: '夏日珍珠雙層愛心鎖骨鍊', price: 880, id: 29 },
];

const featuredSide = [
  { img: '/images/top/n2.PNG', name: '法式珍珠碎銀雙鍊手鍊', price: 880, id: 27 },
  { img: '/images/top/n3.PNG', name: '極簡素圈 & 珍珠戒指組合', price: 550, id: 30 },
];

export function HomePage() {
  const [rotation, setRotation] = useState(0);

  // Cross-fade the featured tile every three seconds, as the original did.
  useEffect(() => {
    const timer = window.setInterval(
      () => setRotation((index) => (index + 1) % featuredRotation.length),
      3000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const featured = featuredRotation[rotation]!;

  return (
    <section className="flex flex-col items-center">
      <div
        className="relative flex w-[92%] max-w-5xl flex-col rounded-sm bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/top/top.PNG)', minHeight: 500 }}
      >
        <div className="mx-auto my-28 flex w-[90%] max-w-md flex-col items-center gap-5 text-center">
          <h1 className="brand text-4xl tracking-tight text-white sm:text-5xl">MAISIE</h1>
          <h3 className="text-[15px] italic text-white">
            Adorn with Maisie: Where Pearls Become Poetry
          </h3>
          <Link to="/store" className="btn-taupe font-bold italic">
            PICK
          </Link>
        </div>
      </div>

      <div className="w-[92%] max-w-5xl pt-12 pb-4">
        <h2 className="text-4xl sm:text-[45px]">
          <Link to="/store" className="nav-item border-b-[3px]">
            New!
          </Link>
        </h2>

        <div className="mt-6 flex flex-col gap-10 md:flex-row">
          <Link to={`/product/${featured.id}`} className="group w-full md:w-1/2">
            <img
              src={featured.img}
              alt={featured.name}
              className="w-full rounded-sm object-cover transition-opacity duration-500"
            />
            <div className="mt-2">
              <h3 className="text-[15px] group-hover:underline">{featured.name}</h3>
              <p className="text-[15px] text-ink-soft">{formatPrice(featured.price)}</p>
            </div>
          </Link>

          <div className="flex w-full flex-col gap-6 md:w-1/2">
            {featuredSide.map((item) => (
              <Link key={item.id} to={`/product/${item.id}`} className="group">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full rounded-sm object-cover"
                />
                <div className="mt-2">
                  <h3 className="text-[15px] group-hover:underline">{item.name}</h3>
                  <p className="text-[15px] text-ink-soft">{formatPrice(item.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
