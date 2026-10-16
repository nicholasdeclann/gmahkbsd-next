import OpenInNew from "@mui/icons-material/OpenInNew";
import { Alert, Box, Button, Typography } from "@mui/material";
import PhotoGallery from "@/components/PhotoGallery";
import { churchConfig } from "@/config/church";
import { isLocalDemo } from "@/lib/localDemo";

export default function PhotosAdminPage() {
  const canvaUrl = new URL(churchConfig.pengumumanEmbedUrl);
  canvaUrl.searchParams.delete("embed");
  return <>
    <Typography component="h1" variant="h4" sx={{ fontWeight: 350, mb: 1 }}>Pengumuman</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Terbitkan informasi dari departemen mana pun untuk dibaca jemaat. Pengumuman Canva tetap tersedia.</Typography>
    <details className="quiet-disclosure"><summary>Canva & tampilan publik</summary><div className="secondary-actions">
    <Button startIcon={<OpenInNew/>} component="a" href={canvaUrl.toString()} target="_blank" rel="noopener noreferrer" variant="outlined">Buka Pengumuman di Canva ↗</Button>
    <Button component="a" href="/pengumuman" target="_blank" rel="noopener noreferrer" sx={{ ml: 1 }}>Lihat Papan Pengumuman ↗</Button>
    </div></details>
    <Box sx={{ mt: 4 }}><PhotoGallery editable /></Box>
  </>;
}
