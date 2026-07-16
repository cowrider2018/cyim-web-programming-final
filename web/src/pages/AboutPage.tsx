import { Link } from 'react-router-dom';

const team = [
  '/images/us/11144115.jpg',
  '/images/us/11144128.jpg',
  '/images/us/11144136.jpg',
  '/images/us/11144217.JPG',
  '/images/us/11144221.JPG',
  '/images/us/11144252.jpg',
];

export function AboutPage() {
  return (
    <div className="mx-auto w-[90%] max-w-4xl py-14">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-ink-faint uppercase">About Us</p>
        <h1 className="mt-4 text-5xl italic">關於 Maisie</h1>
      </header>

      <div className="mx-auto mt-10 max-w-3xl rounded-[10px] bg-sand p-6 shadow-[0_4px_8px_rgba(0,0,0,0.1)] sm:p-10">
        <div className="space-y-5 leading-relaxed text-ink-soft">
          <p>
            Maisie 是一個以「輕珠寶」為核心的飾品選物品牌。我們相信，飾品不需要昂貴或隆重，
            而是應該能自然融入每一天的穿搭裡——上班、上課、和朋友吃飯，都能戴著它。
          </p>
          <p>
            每一件商品在上架前都經過實際配戴測試：耳環會不會太重、鍊子長度會不會卡到領口、
            戒圈會不會刮手。我們寧可少上架幾款，也不希望你收到後只戴一次就收進抽屜。
          </p>
          <p>
            目前所有商品皆由台灣在地工作室小批製作，並使用不易褪色的鍍層與淡水珍珠。
            若配戴後有任何問題，歡迎隨時透過 Instagram 或 Email 與我們聯絡。
          </p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-4 sm:grid-cols-6">
        {team.map((src) => (
          <div
            key={src}
            className="aspect-square overflow-hidden rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
          >
            <img src={src} alt="" loading="lazy" className="size-full object-cover" />
          </div>
        ))}
      </div>

      <section className="mt-12 rounded-[20px] bg-white p-8 text-center shadow-[0_5px_15px_rgba(0,0,0,0.06)]">
        <h2 className="text-3xl italic">想找點什麼？</h2>
        <p className="mt-2 text-sm text-ink-soft">
          從項鍊、手鍊到耳飾與戒指，慢慢逛，總有一件適合你。
        </p>
        <Link to="/store" className="btn-taupe mt-6">
          前往商店
        </Link>
      </section>
    </div>
  );
}
