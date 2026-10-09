import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { churchWeekStart, dateToSerial, serialToDate } from "../src/lib/kertasAcaraForm.ts";

const base = process.env.DASHBOARD_TEST_URL ?? "http://127.0.0.1:3000";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Smoke test only runs on localhost");
const env = await readFile(new URL("../.env.development.local", import.meta.url), "utf8");
const password = env.match(/^ADMIN_PASSWORD=(.+)$/m)?.[1].trim();
assert.ok(password, "Configure ADMIN_PASSWORD in .env.development.local");
let cookie;
const api = (path, { method = "GET", body, authenticated = true, origin = base, session = cookie } = {}) => fetch(`${base}${path}`, {
  method, redirect: "manual", headers: { Origin: origin, ...(authenticated && session ? { Cookie: session } : {}),
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});
let checks = 0;
function check(name, actual, expected) { assert.deepEqual(actual, expected, name); checks++; console.log(`PASS ${name}`); }

check("Sheets date serial round trip", serialToDate(dateToSerial("2026-10-10")), "2026-10-10");
check("Jakarta Saturday before midnight", churchWeekStart(new Date("2026-10-10T16:59:59Z")), "2026-10-03T17:00:00.000Z");
check("Jakarta Sunday rollover", churchWeekStart(new Date("2026-10-10T17:00:00Z")), "2026-10-10T17:00:00.000Z");
check("Unauthenticated dashboard redirects", (await api("/admin", { authenticated: false })).status, 307);
for (const [path, method] of [["/api/admin/kertas-acara", "GET"], ["/api/admin/kertas-acara", "PUT"], ["/api/prayer/manage", "GET"],
  ["/api/prayer", "POST"], ["/api/prayer/1", "PUT"], ["/api/prayer/1", "DELETE"], ["/api/prayer/manage", "DELETE"],
  ["/api/photos/1", "PATCH"], ["/api/photos/upload", "POST"], ["/api/drive/auth/login", "GET"]]) {
  check(`Protected ${method} ${path}`, (await api(path, { method, authenticated: false })).status, 401);
}
check("Cross-origin login rejected", (await api("/api/admin/login", { method: "POST", body: { password }, origin: "https://example.invalid" })).status, 403);
check("Wrong password rejected", (await api("/api/admin/login", { method: "POST", body: { password: "incorrect-test-password" } })).status, 401);
const login = await api("/api/admin/login", { method: "POST", body: { password } });
check("Password login", login.status, 200);
cookie = login.headers.get("set-cookie")?.split(";")[0];
assert.ok(cookie);
check("Session is HttpOnly", login.headers.get("set-cookie").includes("HttpOnly"), true);
check("Tampered session rejected", (await api("/api/admin/kertas-acara", { session: `${cookie.slice(0, -1)}x` })).status, 401);
const initial = await (await api("/api/admin/kertas-acara")).json();
assert.equal(initial.mode, "demo", "Refusing to write outside local demo mode");
let prayerId;
let changedWeekly = false;
try {
  check("Cross-origin save rejected", (await api("/api/admin/kertas-acara", { method: "PUT", body: { revision: initial.revision, values: initial.values }, origin: "https://example.invalid" })).status, 403);
  check("Invalid request body rejected", (await api("/api/admin/kertas-acara", { method: "PUT", body: null })).status, 400);
  check("Invalid date rejected", (await api("/api/admin/kertas-acara", { method: "PUT", body: { revision: initial.revision, values: { ...initial.values, date: "2026-10-09" } } })).status, 400);
  check("Unknown hymn rejected", (await api("/api/admin/kertas-acara", { method: "PUT", body: { revision: initial.revision, values: { ...initial.values, openingHymn: "999999" } } })).status, 400);
  const values = { ...initial.values, sermonTitle: "Local integration test", mainVerse: "Yohanes 3:16", responsiveReading: "Mazmur 23", openingHymn: "21", closingHymn: "421", ssOpeningHymn: "79", ssClosingHymn: "186" };
  const save = await api("/api/admin/kertas-acara", { method: "PUT", body: { revision: initial.revision, values } });
  check("Weekly save", save.status, 200); changedWeekly = true;
  check("Weekly save persisted", (await (await api("/api/admin/kertas-acara")).json()).values, values);
  check("Stale save rejected", (await api("/api/admin/kertas-acara", { method: "PUT", body: { revision: initial.revision, values: initial.values } })).status, 409);
  const prayer = await api("/api/prayer", { method: "POST", body: { name: "Local test name", note: "Private test note" } });
  check("Prayer create", prayer.status, 201);
  prayerId = (await prayer.json()).item.id;
  let publicPrayer = (await (await api("/api/prayer", { authenticated: false })).json()).items.find(item => item.id === prayerId);
  check("Private note omitted from public response", publicPrayer.note, null);
  check("Public response has no admin metadata", Object.keys(publicPrayer).sort(), ["id", "name", "note"]);
  check("Private note retained for admin", (await (await api("/api/prayer/manage")).json()).items.find(item => item.id === prayerId).note, "Private test note");
  check("Prayer update", (await api(`/api/prayer/${prayerId}`, { method: "PUT", body: { name: "Local test name", note: "Public test note", note_public: true } })).status, 200);
  publicPrayer = (await (await api("/api/prayer", { authenticated: false })).json()).items.find(item => item.id === prayerId);
  check("Public note opt-in", publicPrayer.note, "Public test note");
  const missingImage = new FormData();
  check("Announcement requires an image", (await fetch(`${base}/api/photos/upload`, { method: "POST", headers: { Origin: base, Cookie: cookie }, body: missingImage })).status, 400);
  const callback = await api("/api/drive/auth/callback?code=invalid&state=invalid");
  check("Invalid OAuth state returns to settings", new URL(callback.headers.get("location")).pathname, "/admin/settings");
  check("Invalid OAuth state reported", new URL(callback.headers.get("location")).searchParams.get("drive"), "error");
} finally {
  if (prayerId) check("Test prayer cleanup", (await api(`/api/prayer/${prayerId}`, { method: "DELETE" })).status, 200);
  if (changedWeekly) {
    const current = await (await api("/api/admin/kertas-acara")).json();
    check("Restore original weekly values", (await api("/api/admin/kertas-acara", { method: "PUT", body: { revision: current.revision, values: initial.values } })).status, 200);
  }
}
const logout = await api("/api/admin/logout", { method: "POST" });
check("Logout clears cookie", /Max-Age=0/i.test(logout.headers.get("set-cookie")), true);
console.log(`\n${checks} checks passed. All writes used local demo fixtures.`);
