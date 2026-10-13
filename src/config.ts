/**
 * Centralized site configuration.
 * Single source of truth for domain, URLs, and site metadata.
 * Update here once when changing domain names.
 */

/** Primary domain and base URL */
export const SITE_DOMAIN = "https://kimfooburn002.github.io/Kim";
export const SITE_URL = SITE_DOMAIN + "/";
export const SITE_BASE = "/Kim/";
export const SITE_HOME_TITLE = "Kim... and musings on books, bakes and games.";

export function withBase(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = SITE_BASE.replace(/\/$/, '');

  if (normalized === '/') return base;
  if (normalized.startsWith(base)) return normalized;

  return `${base}${normalized}`;
}

export function withSiteUrl(path: string): string {
  return new URL(withBase(path), SITE_URL).toString();
}

/** Asset paths (for files served from astro-public/) */
export const ASSET_BASE = SITE_DOMAIN + SITE_BASE + "static";
export const TEXTURE_GALLERY = ASSET_BASE + "/img/textures/galaxy.webp";
export const TEXTURE_ILLUSION = ASSET_BASE + "/img/textures/illusion.webp";

/** Site metadata */
export const SITE_TITLE = "Kim";
export const SITE_DESCRIPTION =
  "Reader, gamer, healthy-ish baker with a sweet tooth. Book reviews, game reviews, read-alongs, rambling thoughts about anything and everything and more.";

export default {
  SITE_DOMAIN,
  SITE_URL,
  SITE_BASE,
  ASSET_BASE,
  TEXTURE_GALLERY,
  TEXTURE_ILLUSION,
  SITE_TITLE,
  SITE_DESCRIPTION,
  withBase,
  withSiteUrl,
};
