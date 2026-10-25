"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {Alert,Box,Button,Typography} from "@mui/material";
import { GlassButton } from "../ui/glass/GlassControls";
import Refresh from "@mui/icons-material/Refresh";
import type {DriveHealth} from "@/lib/driveHealthTypes";

export default function GoogleConnectionHealth({compact=false}:{compact?:boolean}) {
  const [health,setHealth]=useState<DriveHealth|null>(null),[loading,setLoading]=useState(true),[connecting,setConnecting]=useState(false),[error,setError]=useState("");
  const check=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError("");
    try{const response=await fetch("/api/admin/google-health",{cache:"no-store",signal});const data=await response.json();if(!response.ok)throw new Error(data.error);if(!signal?.aborted)setHealth(data);}
    catch(err){if(!signal?.aborted)setError(err instanceof Error?err.message:"Status belum dapat dimuat.");}
    finally{if(!signal?.aborted)setLoading(false);}
  },[]);
  useEffect(()=>{const controller=new AbortController();void check(controller.signal);return()=>controller.abort();},[check]);
  async function connect(){
    setConnecting(true);setError("");
    try{const response=await fetch("/api/drive/auth/login",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error);window.location.assign(data.authUrl);}
    catch(err){setError(err instanceof Error?err.message:"Koneksi gagal.");setConnecting(false);}
  }
  const date=(value:string|number)=>new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"}).format(new Date(value))+" WIB";
  const expiries=health?[health.browserExpiresAt,health.refreshTokenExpiresAt].filter((value):value is number=>typeof value==="number"):[];
  const expires=expiries.length?Math.min(...expiries):null;
  const nearExpiry=expires!==null&&expires-Date.now()<=2*86400_000;
  const failed=health&&!["connected","demo"].includes(health.code);
  return <Box component="section" aria-label="Kesehatan koneksi Google" aria-busy={loading} sx={{mb:3}}>
    {compact&&<Typography component="h2" variant="h6" sx={{mb:2}}>Kesehatan Koneksi Google</Typography>}
    {error&&<Alert severity="error" sx={{mb:2}}>{error}</Alert>}
    {loading&&<Typography role="status" sx={{mb:2}}>Memeriksa koneksi Google…</Typography>}
    {health&&<>
      <Alert severity={health.code==="connected"?"success":health.code==="demo"?"info":"warning"} sx={{mb:2}}>{health.message}{loading?" (Pemeriksaan ulang sedang berjalan.)":""}</Alert>
      {nearExpiry&&<Alert severity="warning" sx={{mb:2}}>Koneksi pada browser ini {expires!<=Date.now()?"telah berakhir":"akan berakhir dalam kurang dari dua hari"}. Hubungkan ulang sebelum digunakan untuk pelayanan.</Alert>}
      <Typography variant="body2" color="text.secondary" sx={{mb:1}}>Terakhir diperiksa: {date(health.checkedAt)}<br/>Terakhir berhasil di browser ini: {health.lastSuccessfulCheck?date(health.lastSuccessfulCheck):"Belum ada pemeriksaan berhasil yang tercatat."}</Typography>
      {!compact&&health.code!=="demo"&&<details>
        <summary>Detail &amp; Pemulihan</summary>
        <Typography sx={{mb:2}}>Jenis koneksi: {health.source==="shared"?"Bersama · digunakan semua petugas":"Browser ini"}.</Typography>
        {health.source==="shared"?<Typography color="text.secondary" sx={{mb:2}}>Tidak ada kedaluwarsa terjadwal yang diketahui untuk koneksi bersama. Token tetap dapat dicabut atau menjadi tidak valid. Status Testing/Production di Google Cloud tidak dapat dibaca oleh website ini; token dari aplikasi External berstatus Testing dapat berakhir setelah tujuh hari.</Typography>:<Typography color="text.secondary" sx={{mb:2}}>Cookie koneksi browser berlaku tujuh hari. {health.browserExpiresAt?`Berakhir: ${date(health.browserExpiresAt)}.`:"Tanggal berakhir koneksi lama tidak tersedia; hubungkan ulang untuk mencatat tanggalnya."}{health.refreshTokenExpiresAt?` Masa berlaku token yang dilaporkan Google berakhir: ${date(health.refreshTokenExpiresAt)}.`:" Google tidak memberikan tanggal kedaluwarsa refresh token pada koneksi ini."}</Typography>}
        {failed&&<Box sx={{p:2,border:"1px solid var(--site-border)",borderRadius:2,mb:2}}>
          <Typography component="h3" sx={{fontWeight:600,mb:1}}>Cara memulihkan koneksi</Typography>
          {health.code==="not_configured"?<p>Pengelola perlu memeriksa konfigurasi Client ID, client secret, dan ID folder Google Drive pada server.</p>:health.code==="access_denied"||health.code==="folder_unavailable"?<p>Periksa ID folder dan izin akun gereja di Google Drive. Pastikan folder belum dihapus dan akun yang dihubungkan dapat mengaksesnya. Setelah diperbaiki, pilih Refresh.</p>:health.code==="temporary_failure"?<p>Periksa koneksi internet dan coba Refresh. Gangguan sementara belum berarti token kedaluwarsa; tidak perlu langsung mengganti kredensial.</p>:health.source==="shared"?<ol><li>Periksa Google Auth Platform → Audience. Token baru dari aplikasi Production tidak terkena batas Testing tujuh hari.</li><li>{health.code==="client_invalid"?"Periksa pasangan Client ID dan client secret yang aktif di Google Cloud dan Vercel.":"Otorisasi ulang akun gereja menggunakan OAuth client yang sama untuk memperoleh refresh token baru."}</li><li>Pengelola memperbarui kredensial yang diperlukan pada environment Production di Vercel, lalu melakukan redeploy.</li><li>Kembali ke halaman ini dan pilih Refresh.</li></ol>:<p>Pilih Hubungkan Google Drive untuk mengotorisasi ulang akun gereja pada browser ini.</p>}
          {health.source==="shared"&&<Typography variant="body2" color="text.secondary">Koneksi browser tidak menggantikan token bersama pada server. Jangan membagikan token atau client secret melalui chat.</Typography>}
        </Box>}
      </details>}
    </>}
    <Box sx={{display:"flex",gap:1,flexWrap:"wrap",mt:2}}>
      <GlassButton startIcon={<Refresh/>} disabled={loading||connecting} onClick={()=>void check()}>Refresh</GlassButton>
      {compact?<Button component={Link} href="/admin/settings/google">Detail & Pemulihan</Button>:health?.source==="browser"&&health.configured&&health.code!=="demo"&&<Button variant="contained" disabled={loading||connecting} onClick={()=>void connect()}>{connecting?"Menghubungkan…":"Hubungkan Google Drive"}</Button>}
    </Box>
  </Box>;
}
