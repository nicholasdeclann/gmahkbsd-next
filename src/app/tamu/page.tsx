import type {Metadata} from "next";
import GuestShell from "@/components/guests/GuestShell";
import GuestRegister from "@/components/guests/GuestRegister";
import {currentSaturday,isSaturday} from "@/lib/guestTypes";
import {isLocalDemo} from "@/lib/localDemo";
import {isAuthenticated} from "@/lib/adminAuth";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Daftar Tamu | GMAHK BSD",robots:{index:false,follow:false}};
export default async function GuestPage({searchParams}:{searchParams:Promise<{date?:string}>}){
  const {date}=await searchParams;const valid=typeof date==="string"&&isSaturday(date);
  return <GuestShell authenticated={await isAuthenticated()} readOnly={false} demo={isLocalDemo()}><GuestRegister initialDate={valid?date:currentSaturday()} invalidDate={Boolean(date)&&!valid}/></GuestShell>;
}
