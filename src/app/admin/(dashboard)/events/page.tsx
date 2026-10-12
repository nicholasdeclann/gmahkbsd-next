import { Typography } from "@mui/material";
import EventPhotos from "@/components/events/EventPhotos";
export default function AdminEventsPage(){return <><Typography component="h1" variant="h4" sx={{mb:2}}>Kegiatan Jemaat</Typography><Typography color="text.secondary" sx={{mb:4}}>Unggah foto kegiatan yang sudah berlangsung. Foto terbit dari bulan kalender sebelumnya muncul di carousel Beranda. Foto lainnya tetap tersedia di arsip.</Typography><EventPhotos manage/></>;}
