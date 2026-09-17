/**
 * A lightweight, module-level cache for Google Sheets `gviz` responses.
 *
 * Data is stored in memory for the lifetime of the page session (it survives
 * client-side navigations but clears on a full reload/tab close). This avoids
 * re-fetching the same sheets on every visit or navigation, while still
 * refreshing after a configurable TTL so edits made in the spreadsheet appear
 * without requiring a hard reload.
 *
 * In-flight requests are de-duplicated: concurrent callers for the same URL
 * (e.g. React StrictMode double-invoking an effect, or multiple components
 * requesting the same tab) share a single network request.
 */

interface CacheEntry {
  /** Timestamp (ms) when the value was stored. */
  storedAt: number;
  /** Resolved response text. */
  value: string;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string>>();

/**
 * Fetch a URL as text, returning a cached copy if it is still within `ttlMs`.
 *
 * @param url   The URL to fetch.
 * @param ttlMs How long a cached response stays fresh, in milliseconds.
 */
export async function fetchTextCached(
  url: string,
  ttlMs: number,
): Promise<string> {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && now - cached.storedAt < ttlMs) {
    return cached.value;
  }

  const existing = inflight.get(url);
  if (existing) return existing;

  const request = fetch(url)
    .then((res) => res.text())
    .then((text) => {
      cache.set(url, { storedAt: Date.now(), value: text });
      return text;
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, request);
  return request;
}

/** Common TTLs (in milliseconds) for the different sheet data sources. */
export const CACHE_TTL = {
  /** Worship order + hymnal — changes occasionally during the week. */
  liturgy: 10 * 60 * 1000,
  /** Participant schedule — may be edited during the day. */
  schedule: 5 * 60 * 1000,
  /** Birthdays — change at most once per year per person. */
  birthdays: 60 * 60 * 1000,
} as const;
