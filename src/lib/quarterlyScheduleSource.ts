// One bounded cache entry, keyed by workbook/tab URL. Never mix replacement workbooks.
let saved: { key: string; text: string; at: number } | undefined;
let pending: { key: string; request: Promise<string> } | undefined;
const FRESH_MS = 5 * 60 * 1000;
const FALLBACK_MS = 60 * 60 * 1000;

export async function readQuarterlySource(key: string, force: boolean, validate: (text: string) => void) {
  if (!force && saved?.key === key && Date.now() - saved.at < FRESH_MS) {
    return { text: saved.text, stale: false };
  }
  if (pending && pending.key !== key) saved = undefined;
  if (!pending || pending.key !== key) {
    const request = (async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(key, { cache: "no-store", signal: AbortSignal.timeout(8000) });
          if (!response.ok) throw new Error(`Google status ${response.status}`);
          const text = await response.text();
          validate(text);
          saved = { key, text, at: Date.now() };
          return text;
        } catch (error) {
          if (attempt === 1) throw error;
        }
      }
      throw new Error("Schedule unavailable");
    })();
    pending = { key, request };
    // Only clear the matching request; another workbook may have started loading.
    void request.finally(() => { if (pending?.request === request) pending = undefined; }).catch(() => {});
  }
  try { return { text: await pending.request, stale: false }; }
  catch (error) {
    if (saved?.key === key && Date.now() - saved.at < FALLBACK_MS) {
      return { text: saved.text, stale: true };
    }
    throw error;
  }
}
