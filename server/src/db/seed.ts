import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { env } from '../env.js';
import { hashPassword } from '../lib/password.js';
import { db, sqlite } from './client.js';
import {
  cartItems,
  categories,
  orderItems,
  orders,
  productImages,
  products,
  reviews,
  users,
  variants,
} from './schema.js';
import { seedCategories } from './seed-data.js';

const here = dirname(fileURLToPath(import.meta.url));
const imagesRoot = resolve(here, '../../../web/public/images');

/**
 * Image files are still named after the legacy item id — `<legacyId>_<n>.PNG`
 * inside a folder named after the legacy category id. Reading the directory
 * keeps the seed honest: a product only gets image rows for files that exist.
 */
function findImages(legacyTypeId: number, legacyId: number): string[] {
  let entries: string[];
  try {
    entries = readdirSync(join(imagesRoot, String(legacyTypeId)));
  } catch {
    return [];
  }

  return entries
    .filter((file) => new RegExp(`^${legacyId}_\\d+\\.(png|jpe?g)$`, 'i').test(file))
    .sort()
    .map((file) => `/images/${legacyTypeId}/${file}`);
}

async function seed() {
  console.log('Seeding database…');

  // Child-first delete order keeps the foreign keys satisfied.
  db.delete(reviews).run();
  db.delete(orderItems).run();
  db.delete(orders).run();
  db.delete(cartItems).run();
  db.delete(productImages).run();
  db.delete(variants).run();
  db.delete(products).run();
  db.delete(categories).run();
  db.delete(users).run();

  const [adminHash, customerHash] = await Promise.all([
    hashPassword(env.SEED_ADMIN_PASSWORD),
    hashPassword(env.SEED_CUSTOMER_PASSWORD),
  ]);

  db.transaction((tx) => {
    tx.insert(users)
      .values([
        {
          email: 'admin@maisie.tw',
          passwordHash: adminHash,
          name: '店長',
          phone: '0900000000',
          address: '桃園市中壢區中北路200號',
          birthDate: '1995-01-01',
          role: 'admin',
        },
        {
          // Carried over from the single Member row in the original dump.
          email: 'asd1234@gmail.com',
          passwordHash: customerHash,
          name: '王大明',
          phone: '0999999999',
          address: '台北市大安區信義路四段888號',
          birthDate: '2003-09-11',
          role: 'customer',
        },
      ])
      .run();

    let imageCount = 0;
    let variantCount = 0;
    let productCount = 0;

    seedCategories.forEach((category, categoryIndex) => {
      const inserted = tx
        .insert(categories)
        .values({
          slug: category.slug,
          name: category.name,
          nameEn: category.nameEn,
          position: categoryIndex,
        })
        .returning({ id: categories.id })
        .get();

      if (!inserted) throw new Error(`Failed to insert category ${category.slug}`);

      for (const product of category.products) {
        const row = tx
          .insert(products)
          .values({
            categoryId: inserted.id,
            name: product.name,
            description: product.description,
            price: product.price,
            isActive: true,
          })
          .returning({ id: products.id })
          .get();

        if (!row) throw new Error(`Failed to insert product ${product.name}`);
        productCount += 1;

        tx.insert(variants)
          .values(
            product.variants.map((variant, index) => ({
              productId: row.id,
              name: variant.name,
              stock: variant.stock,
              position: index,
            })),
          )
          .run();
        variantCount += product.variants.length;

        const images = findImages(category.legacyTypeId, product.legacyId);
        if (images.length > 0) {
          tx.insert(productImages)
            .values(
              images.map((url, index) => ({ productId: row.id, url, position: index })),
            )
            .run();
          imageCount += images.length;
        } else {
          console.warn(`  ! no images found for ${product.name} (${product.legacyId})`);
        }
      }
    });

    console.log(
      `  ${seedCategories.length} categories, ${productCount} products, ${variantCount} variants, ${imageCount} images`,
    );
  });

  console.log('\nSeed complete. Sign in with:');
  console.log(`  admin     admin@maisie.tw   / ${env.SEED_ADMIN_PASSWORD}`);
  console.log(`  customer  asd1234@gmail.com / ${env.SEED_CUSTOMER_PASSWORD}`);
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => sqlite.close());
