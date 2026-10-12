import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/adminAuth";
import { adminRequestError } from "@/lib/adminRequest";
import { cachedEvents, listEvents, uploadEvent, EventError, eventsConfigured } from "@/lib/events";
import { eventDetails, EVENT_IMAGE_TYPES, EVENT_MAX_BYTES, previousMonth } from "@/lib/eventTypes";
import { isLocalDemo } from "@/lib/localDemo";
import { eventResponseError } from "@/lib/eventResponse";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const admin = req.nextUrl.searchParams.get("manage") === "true";
    if (admin && !(await isAuthenticated())) return NextResponse.json({error:"Silakan masuk kembali."},{status:401});
    const month = req.nextUrl.searchParams.get("month") || previousMonth();
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    if (cursor && cursor.length > 2000) throw new EventError("Halaman tidak valid.",400);
    const limit = req.nextUrl.searchParams.get("preview") === "true" ? 12 : 100;
    const result = admin || isLocalDemo() ? await listEvents(month,admin,cursor,limit) : await cachedEvents(month,cursor,limit);
    return NextResponse.json({...result,month,configured:eventsConfigured(),mode:isLocalDemo()?"demo":"drive"},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return eventResponseError(error); }
}
export async function POST(req: NextRequest) {
  const authError = await adminRequestError(req); if(authError) return authError;
  try {
    if(Number(req.headers.get("content-length")) > EVENT_MAX_BYTES + 100_000) throw new EventError("Ukuran gambar maksimal 4 MB.",413);
    const form = await req.formData(), file = form.get("file");
    if(!(file instanceof File) || !file.size || !EVENT_IMAGE_TYPES.includes(file.type)) throw new EventError("Pilih gambar JPG, PNG, atau WebP.",400);
    if(file.size > EVENT_MAX_BYTES) throw new EventError("Ukuran gambar maksimal 4 MB.",413);
    let details;
    try { details = eventDetails({title:form.get("title"),eventDate:form.get("eventDate"),caption:form.get("caption"),published:form.get("published") === "true"}); }
    catch(error) {throw new EventError((error as Error).message,400);}
    return NextResponse.json({photo:await uploadEvent(file,details)},{status:201});
  } catch(error) {return eventResponseError(error);}
}
