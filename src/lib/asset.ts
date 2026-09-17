/**
 * Resolve a path to a static asset inside the `public/` directory, accounting
 * for the configured `basePath` (e.g. "/gmahkbsd-next" on GitHub Pages).
 *
 * The base path is read from `NEXT_PUBLIC_BASE_PATH` at build time so that each
 * fork only needs to set an environment variable instead of editing source.
 *
 * @param path Path relative to the `public/` directory, e.g.
 *   "/assets/images/logo.png".
 */
export function asset(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

/**
 * Convenience helper for resolving an image inside
 * `public/assets/images/` by filename, including the configured base path.
 *
 * Works for both plain `<img>`/CSS `url()` references and the `next/image`
 * component. In a static export (`output: export`), `next/image` does not
 * prepend the base path itself, so this helper does it; on Vercel the base
 * path is empty, so the path is passed through to the image optimizer as-is.
 */
export function imageAsset(filename: string): string {
  return asset(`/assets/images/${filename}`);
}
