import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminRequestError } from "@/lib/adminRequest";
import { inspectDriveConnection } from "@/lib/drive";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET() {
  const denied=await adminRequestError();if(denied)return denied;
  const headers={"Cache-Control":"private, no-store",Vary:"Cookie"};
  try {
    const {health,identity}=await inspectDriveConnection();
    const sign=(data:string)=>createHmac("sha256",process.env.ADMIN_SECRET!).update(`google-health:${data}`).digest("hex");
    const store=await cookies();const raw=store.get("google_drive_last_success")?.value;
    if(raw){
      try{
        const [payload,signature]=raw.split(".");const expected=sign(payload);
        if(signature?.length===expected.length && timingSafeEqual(Buffer.from(signature),Buffer.from(expected))){
          const previous=JSON.parse(Buffer.from(payload,"base64url").toString());
          if(previous.identity===identity && typeof previous.at==="string")health.lastSuccessfulCheck=previous.at;
        }
      }catch{/* Ignore invalid or obsolete health history. */}
    }
    if(health.code==="connected"){
      health.lastSuccessfulCheck=health.checkedAt;
      const payload=Buffer.from(JSON.stringify({identity,at:health.checkedAt})).toString("base64url");
      store.set("google_drive_last_success",`${payload}.${sign(payload)}`,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:30*86400});
    }
    return NextResponse.json(health,{headers});
  }catch{return NextResponse.json({error:"Status koneksi belum dapat diperiksa. Coba kembali."},{status:503,headers});}
}
