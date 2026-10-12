import {NextRequest,NextResponse} from "next/server";
import {updateGuest,deleteGuest,GuestError} from "@/lib/guests";
import {guestDetails,isSaturday} from "@/lib/guestTypes";
import {guestHeaders,guestRequestError,guestResponseError,validRevision} from "@/lib/guestResponse";
export const dynamic="force-dynamic";
type Context={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:Context){
  const requestError=guestRequestError(req);if(requestError)return requestError;
  try{
    let body,details;
    try{body=await req.json();details=guestDetails(body);}catch(error){throw new GuestError((error as Error).message,400);}
    if(!validRevision(body.revision))throw new GuestError("Versi catatan tidak valid.",400);
    return NextResponse.json({guest:await updateGuest((await params).id,details,body.revision)},{headers:guestHeaders});
  }catch(error){return guestResponseError(error);}
}
export async function DELETE(req:NextRequest,{params}:Context){
  const requestError=guestRequestError(req);if(requestError)return requestError;
  try{
    let body;try{body=await req.json();}catch{throw new GuestError("Formulir tidak valid.",400);}
    if(!body||typeof body.date!=="string"||!isSaturday(body.date)||!validRevision(body.revision))throw new GuestError("Tanggal atau versi catatan tidak valid.",400);
    await deleteGuest((await params).id,body.date,body.revision);return NextResponse.json({deleted:true},{headers:guestHeaders});
  }catch(error){return guestResponseError(error);}
}
