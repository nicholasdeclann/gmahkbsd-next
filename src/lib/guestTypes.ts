export interface GuestEntry {
  id: string;
  date: string;
  name: string;
  church: string;
  type: "individual" | "group";
  pax: number;
  revision: string;
  createdAt: string;
  updatedAt: string;
}

export function jakartaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  return ["year","month","day"].map(type=>parts.find(part=>part.type===type)!.value).join("-");
}
export function currentSaturday(now = new Date()): string {
  const date = new Date(`${jakartaDate(now)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (6 - date.getUTCDay() + 7) % 7);
  return date.toISOString().slice(0,10);
}
export function isSaturday(date: string): boolean {
  if(!/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date))return false;
  const parsed=new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===date&&parsed.getUTCDay()===6;
}
export function saturdayLabel(date:string):string {
  return new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(`${date}T12:00:00+07:00`));
}
export function guestDetails(body:unknown):Pick<GuestEntry,"date"|"name"|"church"|"type"|"pax"> {
  if(!body||typeof body!=="object"||Array.isArray(body))throw new Error("Formulir tamu tidak valid.");
  const value=body as Record<string,unknown>;
  if(typeof value.date!=="string"||!isSaturday(value.date))throw new Error("Pilih tanggal hari Sabtu.");
  if(typeof value.name!=="string"||!value.name.trim()||value.name.trim().length>150)throw new Error("Isi nama tamu atau keluarga (maksimal 150 karakter).");
  if(typeof value.church!=="string"||value.church.trim().length>150)throw new Error("Jemaat asal maksimal 150 karakter.");
  if(value.type!=="individual"&&value.type!=="group")throw new Error("Pilih jenis tamu.");
  if(typeof value.pax!=="number"||!Number.isSafeInteger(value.pax)||value.pax<1||value.pax>999)throw new Error("Jumlah orang harus angka bulat antara 1 dan 999.");
  if(value.type==="individual"&&value.pax!==1)throw new Error("Tamu perorangan berjumlah 1 orang.");
  if(value.type==="group"&&value.pax<2)throw new Error("Rombongan berjumlah minimal 2 orang.");
  return {date:value.date,name:value.name.trim(),church:value.church.trim(),type:value.type,pax:value.pax};
}
