import { NextRequest, NextResponse } from "next/server";
import { adminRequestError } from "@/lib/adminRequest";
import { editEvent, deleteEvent, EventError } from "@/lib/events";
import { eventDetails } from "@/lib/eventTypes";
import { eventResponseError } from "@/lib/eventResponse";
export const dynamic = "force-dynamic";
type Context = {params:Promise<{id:string}>};
export async function PATCH(req:NextRequest, {params}:Context) {
  const authError = await adminRequestError(req); if(authError) return authError;
  try {
    let details;
    try {details = eventDetails(await req.json());} catch(error) {throw new EventError((error as Error).message,400);}
    return NextResponse.json({photo:await editEvent((await params).id,details)});
  } catch(error) {return eventResponseError(error);}
}
export async function DELETE(req:NextRequest, {params}:Context) {
  const authError = await adminRequestError(req); if(authError) return authError;
  try {await deleteEvent((await params).id); return NextResponse.json({deleted:true});}
  catch(error) {return eventResponseError(error);}
}
