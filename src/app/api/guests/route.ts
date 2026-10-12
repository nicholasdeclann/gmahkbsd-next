import {NextRequest,NextResponse} from "next/server";
import {listGuests,createGuest,GuestError} from "@/lib/guests";
import {currentSaturday,guestDetails} from "@/lib/guestTypes";
import {isLocalDemo} from "@/lib/localDemo";
import {guestHeaders,guestRequestError,guestResponseError,validRevision} from "@/lib/guestResponse";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
  try{const date=req.nextUrl.searchParams.get("date")||currentSaturday();return NextResponse.json({date,guests:await listGuests(date),mode:isLocalDemo()?"demo":"drive"},{headers:guestHeaders});}
  catch(error){return guestResponseError(error);}
}
export async function POST(req:NextRequest){
  const requestError=guestRequestError(req);if(requestError)return requestError;
  try{
    let body,details;
    try{body=await req.json();details=guestDetails(body);}catch(error){throw new GuestError((error as Error).message,400);}
    if(!validRevision(body.requestId))throw new GuestError("Permintaan penyimpanan tidak valid.",400);
    return NextResponse.json({guest:await createGuest(details,body.requestId)},{status:201,headers:guestHeaders});
  }catch(error){return guestResponseError(error);}
}
