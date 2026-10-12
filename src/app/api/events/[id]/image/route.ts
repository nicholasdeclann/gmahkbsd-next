import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/adminAuth";
import { eventImage } from "@/lib/events";
import { eventResponseError } from "@/lib/eventResponse";
export const dynamic = "force-dynamic";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}) {
  try {const image = await eventImage((await params).id,await isAuthenticated());
    return new NextResponse(new Uint8Array(image.bytes),{headers:{"Content-Type":image.mime,"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"}});
  } catch(error) {return eventResponseError(error);}
}
