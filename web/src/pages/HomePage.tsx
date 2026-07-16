import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import { SectionHeading } from '../components/ui';
import { SparkleIcon, ShieldIcon, TruckIcon } from '../components/icons';
import { useCategories, useNewArrivals } from '../hooks/use-catalog';
import { asset } from '../lib/asset';

const categoryImages: Record<string, string> = {
  necklaces: '/images/1/10000002_1.PNG',
  bracelets: '/images/2/10000007_1.PNG',
  earrings: '/images/3/10000012_1.PNG',
  rings: '/images/4/10000019_1.PNG',
};

const values = [
  { icon: SparkleIcon, title: '嚴選材質', body: '不易褪色的鍍層與淡水珍珠，日常配戴也耐得住。' },
  { icon: TruckIcon, title: '快速配送', body: '台灣本島滿千免運，兩個工作天內出貨。' },
  { icon: ShieldIcon, title: '安心保固', body: '收到商品有任何問題，30 天內都能聯繫我們。' },
];

export function HomePage() {
  const newArrivals = useNewArrivals();
  const categories = useCategories();

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[78vh] min-h-[520px] overflow-hidden">
          <img
            src={asset('/images/top/top.PNG')}
            alt=""
            className="size-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-ink/10" />

          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-6xl px-5">
              <div className="fade-up max-w-xl text-cream">
                <p className="text-[11px] font-medium tracking-[0.32em] text-cream/80 uppercase">
                  Handcrafted Jewellery
                </p>
                <h1 className="mt-5 font-display text-5xl leading-[1.05] font-semibold sm:text-6xl md:text-7xl">
                  為日常
                  <br />
                  添一點光
                </h1>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/85">
                  從項鍊到戒指，每一件都以輕盈好搭為前提設計。單戴俐落，疊戴有層次。
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/store"
                    className="btn bg-cream px-8 py-3.5 tracking-wide text-ink hover:bg-gold hover:text-white"
                  >
                    開始選購
                  </Link>
                  <Link
                    to="/store?category=hottest"
                    className="btn border border-cream/40 px-8 py-3.5 tracking-wide text-cream hover:bg-cream/10"
                  >
                    熱門精選
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionHeading eyebrow="Collections" title="分類選購" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.data
            ?.filter((category) => category.slug in categoryImages)
            .map((category) => (
              <Link
                key={category.slug}
                to={`/store?category=${category.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)]"
              >
                <img
                  src={asset(categoryImages[category.slug])}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-[900ms] ease-[var(--ease-out)] group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-2xl font-semibold text-cream">
                    {category.name}
                  </p>
                  <p className="mt-0.5 text-[11px] tracking-[0.2em] text-cream/70 uppercase">
                    {category.nameEn} · {category.productCount}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="flex items-end justify-between">
          <SectionHeading eyebrow="Just In" title="本月新品" />
          <Link
            to="/store"
            className="link-underline hidden text-sm text-ink-soft hover:text-ink sm:block"
          >
            查看全部
          </Link>
        </div>

        <div className="mt-8">
          {newArrivals.isPending ? (
            <ProductGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
              {newArrivals.data?.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.imageUrl}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Editorial band */}
      <section className="relative mt-20 overflow-hidden bg-ink py-24 text-cream">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="eyebrow text-gold-soft">Our Promise</p>
          <p className="mt-6 font-display text-3xl leading-relaxed font-medium sm:text-4xl">
            「飾品不必昂貴或隆重，而是能自然融入每一天的穿搭裡。」
          </p>
          <Link
            to="/about"
            className="link-underline mt-8 inline-block text-sm tracking-wide text-cream/80 hover:text-cream"
          >
            關於 Maisie
          </Link>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {values.map((value) => (
            <div key={value.title} className="flex flex-col items-center text-center">
              <span className="flex size-12 items-center justify-center rounded-full border border-line text-gold">
                <value.icon size={22} />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink">
                {value.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
                {value.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
