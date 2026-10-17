import Link from "next/link";
import { Typography } from "@mui/material";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import PeopleOutline from "@mui/icons-material/PeopleOutline";
import RecordVoiceOverOutlined from "@mui/icons-material/RecordVoiceOverOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import ArrowForward from "@mui/icons-material/ArrowForward";
const weekly=[
  {title:"Presentasi Canva",description:"Pratinjau pelayanan, doa, dan sinkronisasi Canva.",href:"/admin/canva",icon:CampaignOutlined},
  {title:"Kertas Acara",description:"Judul khotbah, ayat, dan lagu.",href:"/admin/kertas-acara",icon:DescriptionOutlined},
  {title:"Pokok Doa",description:"Empat nama dan alasan doa mingguan.",href:"/admin/prayer",icon:FavoriteBorder},
  {title:"Pengumuman",description:"Terbitkan informasi untuk jemaat.",href:"/admin/photos",icon:CampaignOutlined},
  {title:"Kegiatan Jemaat",description:"Foto kegiatan dan arsip bulanan.",href:"/admin/events",icon:PhotoLibraryOutlined},
];
const tools=[
  {title:"Penerima Tamu",description:"Isi daftar tamu Sabat tanpa kata sandi.",href:"/tamu",icon:PeopleOutline},
  {title:"Daftar Tamu untuk MC",description:"Baca daftar tamu untuk penyambutan.",href:"/tamu/mc",icon:RecordVoiceOverOutlined},
  {title:"Pengaturan Website",description:"Koneksi Google dan tautan spreadsheet.",href:"/admin/settings",icon:SettingsOutlined},
];
export default function DashboardPage(){return <>
  <Typography component="h1" variant="h4" sx={{fontWeight:350,mb:1}}>Selamat datang</Typography>
  <Typography color="text.secondary" sx={{mb:4}}>Pilih yang ingin dikerjakan hari ini.</Typography>
  {[{title:"Kelola Konten",items:weekly},{title:"Alat Pelayanan",items:tools}].map(group=><section className="dashboard-group" key={group.title}>
    <h2>{group.title}</h2><nav className="dashboard-task-list" aria-label={group.title}>{group.items.map(task=><Link key={task.href} href={task.href}>
      <task.icon className="task-icon" aria-hidden="true"/><div><h3>{task.title}</h3><p>{task.description}</p></div><ArrowForward className="task-arrow" aria-hidden="true"/>
    </Link>)}</nav>
  </section>)}
</>;}
