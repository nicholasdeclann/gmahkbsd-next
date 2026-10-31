export interface PosterAssignments { version: 1; revision: string; assignments: Record<string, string> }
export function posterDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Pilih tanggal hari Sabtu.");
  const date = new Date(value + "T12:00:00Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || date.getUTCDay() !== 6) throw new Error("Pilih tanggal hari Sabtu.");
  return value;
}
export function changePoster(state: PosterAssignments, expected: string, date: string, id: string | null, revision: string): PosterAssignments {
  posterDate(date);
  if (state.revision !== expected) throw new Error("Penetapan poster telah berubah. Refresh lalu coba lagi.");
  const assignments = { ...state.assignments };
  if (id) {
    // A poster belongs to one Sabbath; moving it removes its previous assignment.
    for (const key of Object.keys(assignments)) if (assignments[key] === id) delete assignments[key];
    assignments[date] = id;
  } else delete assignments[date];
  return { version: 1, revision, assignments };
}
export function posterForDate<T extends { id: string; due_date: string | null; expired: boolean }>(state: PosterAssignments, date: string, posts: T[]): T | null {
  return posts.find(post => post.id === state.assignments[date] && !post.expired && Boolean(post.due_date && post.due_date >= date)) ?? null;
}
