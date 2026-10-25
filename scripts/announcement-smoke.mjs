import assert from "node:assert/strict";
import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { announcementDetails,todayJakarta,addDays } from "../src/lib/announcementTypes.ts";

const base = process.env.DASHBOARD_TEST_URL ?? "http://127.0.0.1:3000";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
assert.equal((await (await fetch(`${base}/api/photos`)).json()).mode, "demo", "Refusing to publish outside local practice mode");
const env = await readFile(new URL("../.env.development.local", import.meta.url), "utf8");
const password = env.match(/^ADMIN_PASSWORD=(.+)$/m)?.[1].trim();
const login = await fetch(`${base}/api/admin/login`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
assert.equal(login.status, 200);
const cookie = login.headers.get("set-cookie").split(";")[0];
const bytes = await readFile(new URL("../public/assets/images/logo.png", import.meta.url));
const ids = [];
let checks = 0;
function check(name, actual, expected) { assert.deepEqual(actual, expected, name); console.log(`PASS ${name}`); checks++; }
function form(department, caption, type = "image/png") {
  const data = new FormData(); data.append("file", new Blob([bytes], { type }), "practice-announcement.png");
  data.append("title","Latihan Pengumuman");data.append("due_date",addDays(todayJakarta(),7));data.append("department", department); data.append("caption", caption); return data;
}
const upload = (data, headers = { Origin: base, Cookie: cookie }) => fetch(`${base}/api/photos/upload`, { method: "POST", headers, body: data });
try {
  check("Optional department defaults to Umum", announcementDetails({caption:"Hello",title:"Test",due_date:todayJakarta()}).department, "Umum");
  check("Unauthenticated upload protected", (await upload(form("Pemuda", "Test"), { Origin: base })).status, 401);
  check("Cross-origin upload blocked", (await upload(form("Pemuda", "Test"), { Origin: "https://example.invalid", Cookie: cookie })).status, 403);
  check("Non-image rejected", (await upload(form("Pemuda", "Test", "text/html"))).status, 400);
  check("Oversized caption rejected", (await upload(form("Pemuda", "x".repeat(2001)))).status, 400);
  for (const department of ["Pemuda", "Pelayanan Wanita", ""]) {
    const response = await upload(form(department, "Latihan papan pengumuman"));
    check(`Publish ${department || "Umum"}`, response.status, 201);
    const post = (await response.json()).photo; ids.push(post.id);
    check("Department retained", post.department, department || "Umum");
    const image = await fetch(new URL(post.image_url, base));
    check("Public poster accessible without login", image.status, 200);
    check("Poster bytes preserved", Buffer.from(await image.arrayBuffer()).equals(bytes), true);
  }
  const publicPosts = (await (await fetch(`${base}/api/photos`)).json()).photos;
  check("Board includes all departments", ids.every(id => publicPosts.some(p => p.id === id)), true);
  const filtered = (await (await fetch(`${base}/api/photos?department=Pemuda`)).json()).photos;
  check("Optional filter respects department", filtered.every(p => p.department === "Pemuda"), true);
  const edit = await fetch(`${base}/api/photos/${ids[0]}`, { method: "PATCH", headers: { Origin: base, Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({ caption: "Keterangan latihan diperbarui" }) });
  check("Staff can edit announcement", edit.status, 200);
  check("Public sees saved description", (await (await fetch(`${base}/api/photos`)).json()).photos.find(p => p.id === ids[0]).caption, "Keterangan latihan diperbarui");
  check("Unknown image cannot expose files", (await fetch(`${base}/api/photos/local-not-a-real-file/image`)).status, 404);
  const patch=(body,authenticated=true)=>fetch(base+"/api/photos/"+ids[0],{method:"PATCH",headers:{Origin:base,...(authenticated?{Cookie:cookie}:{}),"Content-Type":"application/json"},body:JSON.stringify(body)});
  check("Anonymous manage rejected",(await fetch(base+"/api/photos?manage=true")).status,401);
  check("Anonymous patch rejected",(await patch({title:"Changed"},false)).status,401);
  check("Staff can end a post early",(await patch({due_date:addDays(todayJakarta(),-1)})).status,200);
  const managed=(await(await fetch(base+"/api/photos?manage=true",{headers:{Cookie:cookie}})).json()).photos;
  check("Expired remains manageable",managed.some(p=>p.id===ids[0]&&p.expired),true);
  check("Expired missing publicly",(await(await fetch(base+"/api/photos")).json()).photos.some(p=>p.id===ids[0]),false);
  check("Expired image hidden",(await fetch(base+"/api/photos/"+ids[0]+"/image")).status,404);
  const staffImage=await fetch(base+"/api/photos/"+ids[0]+"/image",{headers:{Cookie:cookie}});
  check("Staff sees expired image",staffImage.status,200);
  check("Images not publicly cached",staffImage.headers.get("cache-control"),"private, no-store");
  check("Partial edit preserves title",managed.find(p=>p.id===ids[0]).title,"Latihan Pengumuman");
  check("Staff can reactivate",(await patch({due_date:addDays(todayJakarta(),7)})).status,200);
  check("Reactivated visible",(await(await fetch(base+"/api/photos")).json()).photos.some(p=>p.id===ids[0]),true);
  const deleteUrl = `${base}/api/photos/${ids[0]}`;
  check("Unauthenticated delete protected", (await fetch(deleteUrl, { method: "DELETE", headers: { Origin: base } })).status, 401);
  check("Cross-origin delete blocked", (await fetch(deleteUrl, { method: "DELETE", headers: { Origin: "https://example.invalid", Cookie: cookie } })).status, 403);
  check("Staff can delete announcement", (await fetch(deleteUrl, { method: "DELETE", headers: { Origin: base, Cookie: cookie } })).status, 200);
  check("Deleted announcement absent from public board", (await (await fetch(`${base}/api/photos`)).json()).photos.some(p => p.id === ids[0]), false);
  check("Deleted image inaccessible", (await fetch(`${base}/api/photos/${ids[0]}/image`)).status, 404);
  check("Repeated delete reports missing announcement", (await fetch(deleteUrl, { method: "DELETE", headers: { Origin: base, Cookie: cookie } })).status, 404);
} finally {
  const target = new URL("../work/dashboard-demo.json", import.meta.url);
  const data = JSON.parse(await readFile(target, "utf8"));
  data.announcements = data.announcements.filter(post => !ids.includes(post.id));
  const temp = new URL("../work/dashboard-demo.json.test-tmp", import.meta.url);
  await writeFile(temp, JSON.stringify(data, null, 2)); await rename(temp, target);
  for (const id of ids) {
    assert.match(id, /^local-[a-f0-9-]{36}$/);
    await unlink(new URL(`../work/announcements/${id}`, import.meta.url)).catch(error => { if (error.code !== "ENOENT") throw error; });
  }
}
console.log(`${checks} checks passed. Only disposable local announcement fixtures were created.`);
