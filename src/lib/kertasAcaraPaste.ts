import type { HymnOption, WeeklyValues } from "./kertasAcaraForm";

export type PastedField = "sermonTitle" | "mainVerse" | "responsiveReading" | "openingHymn" | "closingHymn";

export interface PasteResult {
  values: Partial<Pick<WeeklyValues, PastedField>>;
  warnings: string[];
  recognized: number;
}

const LABELS: { key: PastedField; label: string; pattern: string }[] = [
  { key: "sermonTitle", label: "Judul Khotbah", pattern: "judul\\s*khotbah" },
  { key: "mainVerse", label: "Ayat Inti", pattern: "ayat\\s*inti" },
  { key: "responsiveReading", label: "Ayat Bersahutan", pattern: "ayat\\s*bersahut(?:an)?" },
  { key: "openingHymn", label: "Lagu Buka", pattern: "lagu\\s*(?:buka|pembuka)" },
  { key: "closingHymn", label: "Lagu Tutup", pattern: "lagu\\s*(?:tutup|penutup)" },
];
const KNOWN = new RegExp(`^\\s*(${LABELS.map(item => item.pattern).join("|")})\\s*[:：\\-–—]\\s*(.*)$`, "i");
const GENERIC_LABEL = /^\s*[A-Za-z][A-Za-z ]{1,30}\s*[:：]/;
const SMALL_WORDS = new Set(["dan", "yang", "di", "ke", "dari", "untuk", "dengan", "atau", "pada", "dalam", "oleh", "bagi", "akan"]);
const VERSE_SMALL_WORDS = new Set(["dan", "atau", "s/d", "sampai", "ayat", "pasal", "dari"]);

function cleanLine(line: string): string {
  return line
    .replace(/[ \t\u00a0\u200b]+/g, " ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .replace(/([,;])(?=[A-Za-z])/g, "$1 ")
    .trim();
}

function upperFirst(word: string): string {
  const index = word.search(/[A-Za-z]/);
  return index < 0 ? word : word.slice(0, index) + word[index].toUpperCase() + word.slice(index + 1);
}

function titleCase(text: string): string {
  return text.toLowerCase().split(" ").map((word, index) =>
    index > 0 && SMALL_WORDS.has(word) ? word : upperFirst(word)).join(" ");
}

export function cleanSermonTitle(value: string): string {
  const text = cleanLine(value);
  if (!/[A-Za-z]/.test(text)) return text;
  const letters = text.replace(/[^A-Za-z]/g, "");
  const upperShare = letters.replace(/[^A-Z]/g, "").length / letters.length;
  if (upperShare > 0.6 || text === text.toLowerCase()) return titleCase(text);
  return upperFirst(text);
}

export function cleanVerse(value: string): string {
  return value.split("\n").map(line => cleanLine(line)
    .replace(/(\d)\s*:\s*(\d)/g, "$1:$2")
    .replace(/(\d)\s*[-–—]\s*(\d)/g, "$1-$2")
    .split(" ")
    .map(word => {
      const lower = word.toLowerCase();
      if (VERSE_SMALL_WORDS.has(lower)) return lower;
      if (word.length > 3 && word === word.toUpperCase()) return upperFirst(lower);
      return upperFirst(word);
    })
    .join(" ")).filter(Boolean).join("\n");
}

export function parseKertasAcaraPaste(text: string, hymns: HymnOption[]): PasteResult {
  const normalized = text.replace(/\r\n?/g, "\n").replace(/[*_~]/g, "").replace(/\u00a0/g, " ");
  const raw: Partial<Record<PastedField, string[]>> = {};
  const warnings: string[] = [];
  let current: PastedField | null = null;
  let unknown = 0;

  for (const line of normalized.split("\n")) {
    const match = KNOWN.exec(line);
    if (match) {
      const entry = LABELS.find(item => new RegExp(`^(?:${item.pattern})$`, "i").test(match[1].trim()));
      if (entry) {
        current = entry.key;
        raw[current] = [match[2]];
        continue;
      }
    }
    if (GENERIC_LABEL.test(line) && !line.trim().startsWith("-")) {
      current = null;
      unknown++;
      continue;
    }
    if (current && line.trim()) raw[current]!.push(line);
  }

  const values: PasteResult["values"] = {};
  for (const { key, label } of LABELS) {
    const lines = raw[key];
    if (!lines) continue;
    const joined = lines.map(item => item.trim()).filter(Boolean).join("\n");
    if (!joined) continue;
    if (key === "sermonTitle") values[key] = cleanSermonTitle(joined.replace(/\n+/g, " "));
    else if (key === "mainVerse") values[key] = cleanVerse(joined.replace(/\n+/g, " "));
    else if (key === "responsiveReading") values[key] = cleanVerse(joined);
    else {
      const number = /\d+/.exec(joined)?.[0];
      const normalizedNumber = number === undefined ? "" : String(Number(number));
      if (normalizedNumber && hymns.some(hymn => hymn.number === normalizedNumber)) values[key] = normalizedNumber;
      else warnings.push(`${label} "${joined}" tidak ditemukan di Lagu Sion.`);
    }
  }

  const recognized = Object.keys(values).length;
  if (unknown) warnings.push(`${unknown} baris tidak dikenali dan diabaikan.`);
  if (!Object.keys(raw).length) warnings.unshift("Format tidak dikenali. Pastikan setiap baris diawali \"Judul Khotbah :\", \"Ayat Inti :\", dst.");
  return { values, warnings, recognized };
}
