import { churchConfig } from "@/config/church";

const { schedule, liturgy } = churchConfig.sheets;

export const SHEET_ID = schedule.sheetId;
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${schedule.gid}`;

export const SHEET_ID_2 = liturgy.sheetId;
export const KERTAS_ACARA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID_2}/gviz/tq?tqx=out:json&gid=${liturgy.kertasAcaraGid}`;
export const LAGU_SION_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID_2}/gviz/tq?tqx=out:json&gid=${liturgy.laguSionGid}`;
