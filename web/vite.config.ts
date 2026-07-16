import { copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, normalizePath, type Plugin } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const serverSrc = resolve(here, '../server/src');

/**
 * Points the server's data layer at the browser.
 *
 * The services import `db` from server/src/db/client.ts, which opens
 * better-sqlite3 — a native module that cannot exist in a page. Swapping that
 * one module for the sql.js client is what lets the demo reuse the services
 * unmodified instead of reimplementing them. It matches on the resolved id
 * rather than the specifier because every importer spells it differently
 * ('../../db/client.js', './client.js'); only the resolved path is the same.
 */
function demoDatabasePlugin(): Plugin {
  const target = normalizePath(resolve(serverSrc, 'db/client.ts'));
  const browserClient = resolve(here, 'src/demo/client.ts');

  return {
    name: 'maisie:demo-database',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (resolved && normalizePath(resolved.id) === target) return browserClient;
      return null;
    },
  };
}

/**
 * Makes deep links work on GitHub Pages.
 *
 * Pages looks for a file at the requested path, so /product/12 — a route that
 * only exists inside React Router — has nothing to serve and 404s. Pages does
 * serve 404.html for a miss, so shipping the app as 404.html boots it anyway
 * and the router reads the URL as usual. Refreshes and shared links resolve;
 * the only cost is that the response carries a 404 status.
 */
function spaFallbackPlugin(outDir: string): Plugin {
  return {
    name: 'maisie:spa-fallback',
    apply: 'build',
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, here, '');
  const demo = env.VITE_DEMO === 'true';
  const outDir = resolve(here, 'dist');

  return {
    // GitHub Pages serves the app from /<repo>/, not the domain root.
    base: env.BASE_PATH || '/',
    plugins: [
      react(),
      tailwindcss(),
      ...(demo ? [demoDatabasePlugin(), spaFallbackPlugin(outDir)] : []),
    ],
    resolve: {
      alias: { '@server': serverSrc },
    },
    server: {
      port: 5173,
      // Proxying keeps the browser on one origin in dev, so the session cookie is
      // first-party and no CORS preflight is involved.
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // The demo client opens the database with a top-level await so that `db`
      // is live before any service module body runs.
      target: 'esnext',
    },
    optimizeDeps: {
      esbuildOptions: { target: 'esnext' },
    },
  };
});
