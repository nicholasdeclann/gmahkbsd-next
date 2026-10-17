import type {Metadata} from "next";
import GuestShell from "@/components/guests/GuestShell";
import GuestRegister from "@/components/guests/GuestRegister";
import {currentSaturday,isSaturday} from "@/lib/guestTypes";
import {isLocalDemo} from "@/lib/localDemo";
import {isAuthenticated} from "@/lib/adminAuth";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Daftar Tamu untuk MC | GMAHK BSD",robots:{index:false,follow:false}};
export default async function McPage({searchParams}:{searchParams:Promise<{date?:string}>}){
  const {date}=await searchParams;const valid=typeof date==="string"&&isSaturday(date);
  return <GuestShell authenticated={await isAuthenticated()} readOnly demo={isLocalDemo()}><GuestRegister readOnly initialDate={valid?date:currentSaturday()} invalidDate={Boolean(date)&&!valid}/></GuestShell>;
}
