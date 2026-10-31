import { listAnnouncements } from "./announcements";
import { getPosterAssignments } from "./sabbathPosters";
import { posterDate, posterForDate } from "./sabbathPosterTypes";

export async function resolveSabbathPoster(date: string) {
  posterDate(date);
  const state = await getPosterAssignments();
  if (!state.assignments[date]) return null;
  return posterForDate(state, date, await listAnnouncements());
}
