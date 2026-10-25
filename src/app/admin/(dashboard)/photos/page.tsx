import {Typography} from "@mui/material";
import AnnouncementGallery from "@/components/AnnouncementGallery";
export default function PhotosAdminPage(){return <><Typography component="h1" variant="h4" sx={{mb:1}}>Pengumuman</Typography><Typography color="text.secondary" sx={{mb:3}}>Kelola informasi untuk seluruh jemaat.</Typography><AnnouncementGallery editable/></>;}