const KEY = "__gmahkHistoryIndex";
let activeGuard: ((event: PopStateEvent) => void) | null = null;
export function registerHistoryGuard(guard: (event: PopStateEvent) => void) {
  activeGuard = guard;
  return () => { if (activeGuard === guard) activeGuard = null; };
}
export function historyIndex(state: unknown): number | undefined {
  return state && typeof state === "object" && KEY in state && typeof state[KEY] === "number" ? state[KEY] : undefined;
}

/** Tag SPA entries without removing Next's router state. This lets draft guards
 * restore the correct direction even when the adjacent entry is another page. */
export function installHistoryIndex(history: History, host?: Pick<Window, "addEventListener" | "removeEventListener">) {
  const push = history.pushState, replace = history.replaceState;
  const tag = (state: unknown, index: number) => ({ ...(state && typeof state === "object" ? state : {}), [KEY]: index });
  replace.call(history, tag(history.state, historyIndex(history.state) ?? 0), "");
  const indexedPush: History["pushState"] = function (data, unused, url) { push.call(history, tag(data, (historyIndex(history.state) ?? 0) + 1), unused, url); };
  const indexedReplace: History["replaceState"] = function (data, unused, url) { replace.call(history, tag(data, historyIndex(history.state) ?? 0), unused, url); };
  history.pushState = indexedPush; history.replaceState = indexedReplace;
  const pop = (event: Event) => activeGuard?.(event as PopStateEvent);
  host?.addEventListener("popstate", pop, true);
  return () => { host?.removeEventListener("popstate", pop, true); if (history.pushState === indexedPush) history.pushState = push; if (history.replaceState === indexedReplace) history.replaceState = replace; };
}
