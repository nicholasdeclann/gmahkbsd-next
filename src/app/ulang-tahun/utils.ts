export interface Birthday {
  day: number;
  month: number;
  year: number;
}

export interface BirthdayPerson {
  nama: string;
  birthday: Birthday;
  age: number | null;
  birthdayDate: Date;
  dayName: string;
}

export const SHEET_ID = "1TM1e4w1mhgZvXo5JBcihACXPgrmFBKX91_qAp6wbU_Q";
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Get current week range (Sunday to Saturday)
export const getCurrentWeekRange = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  // Calculate Sunday of this week
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);

  // Calculate Saturday of this week
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  return { sunday, saturday };
};

// Format date as "DD MMMM"
export const formatDateShort = (date: Date) => {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${day} ${month}`;
};

// Format date as "DD MMMM YYYY"
export const formatDateLong = (date: Date) => {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Parse birthday from Google Sheets Date string format
export const parseBirthday = (birthdayData: any): Birthday | null => {
  if (!birthdayData) return null;

  // Google Sheets returns dates as strings like "Date(1998,0,27)"
  if (typeof birthdayData === "string" && birthdayData.startsWith("Date(")) {
    // Extract the values: "Date(1998,0,27)" -> [1998, 0, 27]
    const match = birthdayData.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]); // Already 0-indexed from Google Sheets
      const day = parseInt(match[3]);

      return { day, month, year };
    }
  }

  return null;
};

// Check if birthday falls in current week (only check month and day, ignore year)
export const isBirthdayThisWeek = (
  birthday: Birthday,
  weekRange: { sunday: Date; saturday: Date },
) => {
  if (!birthday) return false;

  const today = new Date();
  const currentYear = today.getFullYear();

  // Create birthday date for this year using only month and day
  const birthdayThisYear = new Date(
    currentYear,
    birthday.month,
    birthday.day,
  );

  return (
    birthdayThisYear >= weekRange.sunday &&
    birthdayThisYear <= weekRange.saturday
  );
};

// Calculate age
export const calculateAge = (birthday: Birthday): number | null => {
  if (!birthday) return null;
  const today = new Date();
  const birthDate = new Date(birthday.year, birthday.month, birthday.day);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

// Get day name in Indonesian
export const getDayName = (date: Date) => {
  const days = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  return days[date.getDay()];
};

// Reverse name order (from "Surname Firstname" to "Firstname Surname")
export const reverseName = (name: string) => {
  if (!name) return name;
  const parts = name.trim().split(" ");
  if (parts.length === 1) return name; // Single name, return as-is
  // Move first word to the end, keep rest in order
  const [first, ...rest] = parts;
  return [...rest, first].join(" ");
};
