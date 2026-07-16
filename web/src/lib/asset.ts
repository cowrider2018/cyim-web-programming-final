/**
 * Resolves a public asset path against the app's base URL.
 *
 * Image paths are stored and written as domain-absolute ('/images/...'). That
 * is correct when the app is served from the root, but GitHub Pages serves it
 * from '/<repo>/', where a leading-slash path skips the base and 404s. Vite
 * exposes the configured base as import.meta.env.BASE_URL (always
 * slash-terminated), so joining against it fixes every image in one place and
 * is a no-op when the base is '/'.
 */
export function asset(path: string | null | undefined): string {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path)) return path;
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, '')}`;
}
