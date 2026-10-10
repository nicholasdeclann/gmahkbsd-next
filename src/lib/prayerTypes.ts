export interface PrayerSlot { name: string; note: string; note_public: boolean }
export interface PrayerSnapshot {
  slots: PrayerSlot[]; date: string; revision: string; mode: "demo" | "google";
  canWrite: boolean; notesConfigured: boolean;
}
export const emptyPrayerSlots = (): PrayerSlot[] => Array.from({ length: 4 }, () => ({ name: "", note: "", note_public: false }));

export function validatePrayerSlots(input: unknown): PrayerSlot[] {
  if (!Array.isArray(input) || input.length !== 4) throw new Error("Isi tepat empat slot doa. Slot yang belum dipakai boleh kosong.");
  return input.map((entry, index) => {
    if (!entry || typeof entry !== "object" || typeof entry.name !== "string" || typeof entry.note !== "string" || typeof entry.note_public !== "boolean") throw new Error(`Isian nama ${index + 1} tidak valid.`);
    const name = entry.name.trim(); const note = entry.note.trim();
    if (name.length > 200 || /[\r\n]/.test(name) || note.length > 2000) throw new Error(`Isian nama ${index + 1} terlalu panjang atau tidak valid.`);
    if (!name && note) throw new Error(`Isi nama ${index + 1} sebelum menambahkan alasan doa.`);
    return { name, note, note_public: Boolean(name && note && entry.note_public) };
  });
}

export function nameFromPrayerCell(value: string): string { return value.replace(/^\s*[1-4][.)]\s*/, "").trim(); }
export function prayerCellValues(slots: PrayerSlot[]): string[] { return slots.map((slot, index) => slot.name ? `${index + 1}. ${slot.name}` : ""); }

export function prayerUpdateRequests(slots: PrayerSlot[], sheetId: number) {
  return prayerCellValues(slots).map((name, index) => ({ updateCells: {
    range: { sheetId, startRowIndex: 49 + index, endRowIndex: 50 + index, startColumnIndex: 1, endColumnIndex: 2 },
    rows: [{ values: [{ userEnteredValue: name ? { stringValue: name } : {} }] }], fields: "userEnteredValue",
  } }));
}

// Reasons belong to a specific name and service date, never merely a row number.
export function attachPrayerNotes(names: string[], date: string, notes: { date: string; slots: PrayerSlot[] }): PrayerSlot[] {
  return names.map((name, index) => {
    const saved = notes.slots[index];
    return name && notes.date === date && saved?.name === name
      ? { name, note: saved.note, note_public: saved.note_public } : { name, note: "", note_public: false };
  });
}
