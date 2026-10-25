import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays, announcementDetails, announcementPatch, daysUntil, deriveAnnouncement,
  compareAnnouncements, fallbackTitle, isExpired, nextSabbath, todayJakarta, validDateString,
} from "../src/lib/announcementTypes.ts";

// Jakarta is UTC+7 with no daylight saving.
const at = iso => new Date(iso);

test("todayJakarta rolls over at 00:00 Jakarta (17:00 UTC)", () => {
  assert.equal(todayJakarta(at("2026-10-25T16:59:59Z")), "2026-10-25");
  assert.equal(todayJakarta(at("2026-10-25T17:00:00Z")), "2026-10-26");
});

test("a post is visible through its due date and expires the next day", () => {
  assert.equal(isExpired("2026-10-25", at("2026-10-25T16:59:59Z")), false); // 23:59:59 on the due date
  assert.equal(isExpired("2026-10-25", at("2026-10-25T17:00:00Z")), true);  // 00:00 the next day
  assert.equal(isExpired("2026-10-30", at("2026-10-25T05:00:00Z")), false);
});

test("posts without a due date never expire", () => {
  assert.equal(isExpired(null), false);
  assert.equal(isExpired(undefined), false);
});

test("nextSabbath returns the coming Saturday, or today when it is Saturday", () => {
  assert.equal(nextSabbath(at("2026-10-25T05:00:00Z")), "2026-10-31"); // Sunday in Jakarta
  assert.equal(nextSabbath(at("2026-10-30T05:00:00Z")), "2026-10-31"); // Friday
  assert.equal(nextSabbath(at("2026-10-31T05:00:00Z")), "2026-10-31"); // Saturday morning
  assert.equal(nextSabbath(at("2026-10-31T17:30:00Z")), "2026-11-07"); // already Sunday in Jakarta
});

test("date helpers", () => {
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
  assert.equal(daysUntil("2026-10-27", at("2026-10-25T05:00:00Z")), 2);
  assert.equal(daysUntil("2026-10-24", at("2026-10-25T05:00:00Z")), -1);
  assert.equal(validDateString("2026-02-30"), false);
  assert.equal(validDateString("2026-2-3"), false);
  assert.equal(validDateString("2026-10-25"), true);
});

test("fallbackTitle uses the first caption line, else the department", () => {
  assert.equal(fallbackTitle("\n  Latihan Paduan Suara \nPukul 19.00", "Musik"), "Latihan Paduan Suara");
  assert.equal(fallbackTitle(null, "Pemuda"), "Pengumuman Pemuda");
  assert.equal(fallbackTitle("x".repeat(200), "Umum").length, 80);
});

test("deriveAnnouncement flags expiry and fills a legacy title", () => {
  const raw = { id: "1", drive_file_id: "1", department: "Umum", caption: "Kebaktian Doa", due_date: "2026-10-20", created_at: "2026-10-01T00:00:00Z", image_url: "/x" };
  const post = deriveAnnouncement(raw, at("2026-10-25T05:00:00Z"));
  assert.equal(post.title, "Kebaktian Doa");
  assert.equal(post.expired, true);
  assert.equal(deriveAnnouncement({ ...raw, due_date: null }, at("2026-10-25T05:00:00Z")).expired, false);
});

test("announcementDetails requires a title and a valid, non-past due date", () => {
  const now = at("2026-10-25T05:00:00Z");
  const ok = announcementDetails({ department: " Pemuda ", title: "  Retreat   Pemuda ", caption: " Info ", due_date: "2026-10-25" }, now);
  assert.deepEqual(ok, { department: "Pemuda", title: "Retreat Pemuda", caption: "Info", due_date: "2026-10-25" });
  assert.equal(announcementDetails({ title: "A", due_date: "2026-11-01" }, now).department, "Umum");
  assert.throws(() => announcementDetails({ title: "", due_date: "2026-11-01" }, now), /Judul/);
  assert.throws(() => announcementDetails({ title: "x".repeat(81), due_date: "2026-11-01" }, now), /80/);
  assert.throws(() => announcementDetails({ title: "A" }, now), /Tanggal/);
  assert.throws(() => announcementDetails({ title: "A", due_date: "2026-10-24" }, now), /sebelum hari ini/);
  assert.throws(() => announcementDetails({ title: "A", due_date: "nope" }, now), /tidak valid/);
  assert.throws(() => announcementDetails({ title: "A", due_date: "2026-11-01", caption: "x".repeat(2001) }, now), /2\.000/);
});

test("announcementPatch is partial and allows ending a post early", () => {
  const now = at("2026-10-25T05:00:00Z");
  assert.deepEqual(announcementPatch({ due_date: "2026-10-01" }, now), { due_date: "2026-10-01" });
  assert.deepEqual(announcementPatch({ caption: "  " }, now), { caption: null });
  assert.throws(() => announcementPatch({}, now), /Tidak ada perubahan/);
  assert.throws(() => announcementPatch({ title: "   " }, now), /Judul/);
});

test("board order puts soonest active dates first and expired posts last", () => {
 const raw={id:"a",drive_file_id:"a",department:"Umum",caption:null,title:"Post",created_at:"2026-10-01T00:00:00Z",image_url:"/x",due_date:null};
 const now=at("2026-10-25T05:00:00Z");
 const posts=[{...raw,id:"undated"},{...raw,id:"later",due_date:"2026-11-01"},{...raw,id:"earlier",due_date:"2026-10-26"},{...raw,id:"expired",due_date:"2026-10-24"}].map(p=>deriveAnnouncement(p,now)).sort(compareAnnouncements);
 assert.deepEqual(posts.map(p=>p.id),["earlier","later","undated","expired"]);
});
test("legacy filenames do not require retroactive dates", () => {
 const post=deriveAnnouncement({id:"old",drive_file_id:"old",department:"Pemuda",caption:null,created_at:"2026-01-01T00:00:00Z",image_url:"/x",due_date:null});
 assert.equal(post.title,"Pengumuman Pemuda");assert.equal(post.expired,false);
});
