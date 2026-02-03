export const getThisWeeksSaturday = (columnOffset: number) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  let daysUntilSaturday;

  if (dayOfWeek === 0) {
    daysUntilSaturday = 6;
  } else if (dayOfWeek === 6) {
    daysUntilSaturday = 0;
  } else {
    daysUntilSaturday = 6 - dayOfWeek;
  }

  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday + columnOffset * 7);
  return saturday;
};

export const formatDate = (date: Date) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  return `${day} ${month}`;
};

export const getSaturdayOfMonth = (date: Date) => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstSaturday = new Date(firstDayOfMonth);
  const dayOfWeek = firstDayOfMonth.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  firstSaturday.setDate(1 + daysUntilSaturday);
  const daysDiff = Math.floor(
    (date.getTime() - firstSaturday.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.floor(daysDiff / 7) + 1;
};

export const formatLaguSion = (
  laguNum: string,
  laguSionMap: Record<string, string>,
) => {
  if (!laguNum || !laguSionMap[laguNum]) return "";
  return `LSEL ${laguNum} | ${laguSionMap[laguNum]}`;
};
