import {NextResponse} from "next/server";
import {isSameOrigin} from "./adminRequest";
import {GuestError} from "./guests";
export function guestResponseError(error:unknown){
  const status=(error as {response?:{status?:number}})?.response?.status;
  const conflict=status===412;
  return NextResponse.json({error:error instanceof GuestError?error.message:conflict?"Catatan sudah diubah petugas lain. Muat ulang sebelum menyimpan.":status===404?"Catatan tamu tidak ditemukan.":"Daftar tamu belum dapat dimuat atau disimpan. Silakan coba lagi atau hubungi pengelola website."},{status:error instanceof GuestError?error.status:conflict?409:status===404?404:502,headers:guestHeaders});
}
export const guestHeaders={"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"};
const writes=new Map<string,{count:number;until:number}>();
export function guestRequestError(req:Request){
  if(!isSameOrigin(req))return NextResponse.json({error:"Permintaan tidak diizinkan."},{status:403});
  if(Number(req.headers.get("content-length"))>6000)return NextResponse.json({error:"Formulir terlalu besar."},{status:413});
  // Basic per-instance protection, without claiming this is an authentication boundary.
  const now=Date.now();for(const [key,value] of writes)if(value.until<now)writes.delete(key);
  const address=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local";
  const current=writes.get(address)||{count:0,until:now+60000};current.count++;
  if(writes.size<2000||writes.has(address))writes.set(address,current);
  if(current.count>60)return NextResponse.json({error:"Terlalu banyak penyimpanan. Tunggu sebentar lalu coba lagi."},{status:429,headers:{"Retry-After":"60"}});
  return null;
}
export const validRevision=(value:unknown):value is string=>typeof value==="string"&&/^[a-f0-9-]{36}$/.test(value);
