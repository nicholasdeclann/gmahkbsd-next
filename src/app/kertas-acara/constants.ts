export async function loadSheetUrls() {
  const response = await fetch("/api/sheet-sources", {cache:"no-store"});
  if (!response.ok) throw new Error("Sumber spreadsheet belum dapat dimuat.");
  const {schedule,liturgy} = await response.json() as import("@/lib/sheetSources").SheetSources;
  const base=(id:string,gid:string)=>`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&gid=${gid}`;
  return {SHEET_URL:base(schedule.sheetId,schedule.gid), KERTAS_ACARA_URL:base(liturgy.sheetId,liturgy.kertasAcaraGid), LAGU_SION_URL:base(liturgy.sheetId,liturgy.laguSionGid)};
}
