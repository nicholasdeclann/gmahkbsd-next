import { NextResponse } from "next/server";
import { EventError } from "./events";
export function eventResponseError(error: unknown) {
  const status = (error as {response?: {status?: number}})?.response?.status;
  return NextResponse.json({error: error instanceof EventError ? error.message : status === 404 ? "Foto atau folder tidak ditemukan." : "Kegiatan belum berhasil dimuat atau disimpan. Periksa akses Drive lalu coba lagi."}, {status: error instanceof EventError ? error.status : status === 404 ? 404 : 502, headers:{"Cache-Control":"no-store"}});
}
