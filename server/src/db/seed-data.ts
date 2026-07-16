/**
 * Catalog content carried over from the original MySQL dump (`final.sql`).
 *
 * `legacyId` is the old `Item.itemId`. It is not used as a primary key any
 * more — it only resolves the image files, which are still named after it.
 * Descriptions were blank in the dump and have been written out here so the
 * storefront has real copy to render.
 */

export interface SeedVariant {
  name: string;
  stock: number;
}

export interface SeedProduct {
  legacyId: number;
  name: string;
  description: string;
  price: number;
  variants: SeedVariant[];
}

export interface SeedCategory {
  slug: string;
  name: string;
  nameEn: string;
  legacyTypeId: number;
  products: SeedProduct[];
}

const standard = (stock = 12): SeedVariant[] => [{ name: '標準', stock }];

export const seedCategories: SeedCategory[] = [
  {
    slug: 'necklaces',
    name: '項鍊',
    nameEn: 'Necklaces',
    legacyTypeId: 1,
    products: [
      {
        legacyId: 10000000,
        name: '藍色冰心碎鑽毛衣鍊',
        description: '冰藍鋯石墜飾搭配細緻碎鑽鍊條，長度適合搭配針織與大衣，是秋冬穿搭的亮點。',
        price: 880,
        variants: standard(8),
      },
      {
        legacyId: 10000001,
        name: '珍珠碎鑽雙鍊條鍊',
        description: '雙層設計，一層淡水珍珠、一層碎鑽鍊，layering 感一次到位，不需自行疊戴。',
        price: 980,
        variants: standard(6),
      },
      {
        legacyId: 10000002,
        name: '個性水滴鎖骨鍊',
        description: '水滴造型墜飾，鎖骨鍊長度修飾頸部線條，日常與正式場合都適合。',
        price: 980,
        variants: [
          { name: '金色', stock: 5 },
          { name: '銀色', stock: 5 },
        ],
      },
      {
        legacyId: 10000003,
        name: '幾何線條項鍊',
        description: '簡約幾何墜飾，霧面處理不易反光，適合每天配戴。',
        price: 990,
        variants: standard(10),
      },
      {
        legacyId: 10000004,
        name: '星辰碎鑽項鍊',
        description: '星形墜飾綴以微鑲碎鑽，光線下有細緻閃爍。',
        price: 990,
        variants: standard(10),
      },
      {
        legacyId: 10000005,
        name: '極簡珍珠項鍊',
        description: '單顆淡水珍珠配細鍊，百搭不挑衣著。',
        price: 990,
        variants: standard(10),
      },
    ],
  },
  {
    slug: 'bracelets',
    name: '手鍊',
    nameEn: 'Bracelets',
    legacyTypeId: 2,
    products: [
      {
        legacyId: 10000006,
        name: '珍珠魚尾波浪手鍊',
        description: '波浪造型鍊身串接小顆珍珠，配戴時隨手腕動作有光影變化。',
        price: 580,
        variants: standard(9),
      },
      {
        legacyId: 10000007,
        name: '高級感碎銀珍珠手鍊',
        description: '碎銀與珍珠混搭，可選擇單鍊或雙鍊層次，展現不同風格。',
        price: 450,
        variants: [
          { name: '純珍珠+雙鍊', stock: 4 },
          { name: '純珍珠', stock: 6 },
          { name: '雙鍊', stock: 6 },
        ],
      },
      {
        legacyId: 10000008,
        name: '海藍寶石手鍊',
        description: '海藍寶石切面折射自然光澤，夏日穿搭的清爽選擇。',
        price: 580,
        variants: standard(7),
      },
      {
        legacyId: 10000009,
        name: '編織細鍊手鍊',
        description: '細鍊編織紋理，重量輕盈，久戴無負擔。',
        price: 390,
        variants: standard(12),
      },
      {
        legacyId: 10000010,
        name: '素圈可調式手鍊',
        description: '素面圈環設計，鍊長可調整，適合各種手圍。',
        price: 390,
        variants: [
          { name: '金色', stock: 6 },
          { name: '銀色', stock: 6 },
        ],
      },
      {
        legacyId: 10000011,
        name: '小方鑽手鍊',
        description: '方形鋯石等距排列，低調而有存在感。',
        price: 390,
        variants: standard(12),
      },
    ],
  },
  {
    slug: 'earrings',
    name: '耳飾',
    nameEn: 'Earrings',
    legacyTypeId: 3,
    products: [
      {
        legacyId: 10000012,
        name: '法式水滴珍珠耳飾',
        description: '水滴形珍珠墜，帶有法式復古氣質，重量經過調整不易拉扯耳垂。',
        price: 520,
        variants: standard(8),
      },
      {
        legacyId: 10000013,
        name: '蝴蝶長墜耳飾',
        description: '蝴蝶造型長墜，走動時自然擺盪，適合聚會與拍照。',
        price: 520,
        variants: standard(8),
      },
      {
        legacyId: 10000014,
        name: '簡約韓系蝴蝶結耳飾',
        description: '小巧蝴蝶結貼耳設計，通勤與上課都不突兀。',
        price: 450,
        variants: [
          { name: '金色', stock: 5 },
          { name: '銀色', stock: 5 },
        ],
      },
      {
        legacyId: 10000015,
        name: '珍珠貼耳耳環',
        description: '單顆珍珠貼耳款，最經典的入門選擇。',
        price: 390,
        variants: standard(12),
      },
      {
        legacyId: 10000016,
        name: '細圈耳環',
        description: '細版圈式耳環，直徑適中，好搭配。',
        price: 390,
        variants: standard(12),
      },
      {
        legacyId: 10000017,
        name: '星星流蘇耳飾',
        description: '星形主體搭配短流蘇，增添動態層次。',
        price: 390,
        variants: standard(12),
      },
    ],
  },
  {
    slug: 'rings',
    name: '戒指',
    nameEn: 'Rings',
    legacyTypeId: 4,
    products: [
      {
        legacyId: 10000018,
        name: '編織線條戒指',
        description: '線條交錯編織紋理，適合單戴或與素圈疊戴。',
        price: 390,
        variants: standard(10),
      },
      {
        legacyId: 10000019,
        name: '白貝母素圈戒指',
        description: '白貝母鑲嵌於素圈之上，柔和光澤帶有溫潤感。',
        price: 750,
        variants: [
          { name: '金色', stock: 5 },
          { name: '銀色', stock: 5 },
        ],
      },
      {
        legacyId: 10000020,
        name: '交叉珍珠戒指',
        description: '交叉線條收於一顆小珍珠，開口設計可微調尺寸。',
        price: 580,
        variants: standard(7),
      },
      {
        legacyId: 10000021,
        name: '極簡素圈戒指',
        description: '最基本的素圈，疊戴的必備單品。',
        price: 390,
        variants: standard(14),
      },
      {
        legacyId: 10000022,
        name: '碎鑽線戒',
        description: '細版線戒鑲嵌一整排碎鑽，纖細顯手指。',
        price: 390,
        variants: standard(14),
      },
      {
        legacyId: 10000023,
        name: '波浪開口戒指',
        description: '波浪造型開口戒，尺寸可自行微調。',
        price: 390,
        variants: standard(14),
      },
    ],
  },
  {
    slug: 'hottest',
    name: '熱門精選',
    nameEn: 'Hottest',
    legacyTypeId: 5,
    products: [
      {
        legacyId: 10000024,
        name: '甜酷戒指組合',
        description: '三入戒指組合，可同時疊戴或分開搭配，一次入手最超值。',
        price: 680,
        variants: standard(6),
      },
      {
        legacyId: 10000025,
        name: '簡約氣質項鍊 & 戒指',
        description: '項鍊與戒指成套設計，材質與光澤一致，送禮自用皆宜。',
        price: 550,
        variants: standard(6),
      },
      {
        legacyId: 10000026,
        name: '法式珍珠碎銀雙鍊手鍊',
        description: '珍珠與碎銀雙鍊層次，本店長銷款。',
        price: 880,
        variants: standard(5),
      },
      {
        legacyId: 10000027,
        name: '鬱金香珍珠手鍊',
        description: '鬱金香造型墜飾搭配珍珠，春季主打。',
        price: 850,
        variants: standard(5),
      },
      {
        legacyId: 10000028,
        name: '夏日珍珠雙層愛心鎖骨鍊',
        description: '雙層鎖骨鍊搭配愛心與珍珠，頸部線條層次分明。',
        price: 880,
        variants: standard(5),
      },
      {
        legacyId: 10000029,
        name: '極簡素圈 & 珍珠戒指組合',
        description: '素圈與珍珠戒指雙入組，疊戴最省力的搭配。',
        price: 550,
        variants: standard(6),
      },
    ],
  },
];
