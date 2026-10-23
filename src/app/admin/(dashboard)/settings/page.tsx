import Link from "next/link";
import {redirect} from "next/navigation";
import {Typography} from "@mui/material";
import { CloudOutlined } from "@/components/ui/icons";
import { TableChartOutlined } from "@/components/ui/icons";
import { ArrowForward } from "@/components/ui/icons";
export default async function SettingsPage({searchParams}:{searchParams:Promise<{drive?:string}>}){
 const {drive}=await searchParams;
 if(drive==="error"||drive==="connected")redirect(`/admin/settings/google?drive=${drive}`);
 return <><Typography component="h1" variant="h4" sx={{fontWeight:350,mb:2}}>Pengaturan</Typography><Typography color="text.secondary" sx={{mb:4}}>Pilih pengaturan yang ingin dikelola.</Typography>
 <nav className="dashboard-task-list" aria-label="Pengaturan website">
 <Link href="/admin/settings/spreadsheets"><TableChartOutlined className="task-icon" aria-hidden="true"/><div><h2>Sumber Spreadsheet</h2><p>Kertas Acara dan jadwal pelayanan.</p></div><ArrowForward className="task-arrow" aria-hidden="true"/></Link>
 <Link href="/admin/settings/google"><CloudOutlined className="task-icon" aria-hidden="true"/><div><h2>Koneksi Google</h2><p>Status dan bantuan koneksi Google Drive dan Sheets.</p></div><ArrowForward className="task-arrow" aria-hidden="true"/></Link>
 </nav></>;
}
