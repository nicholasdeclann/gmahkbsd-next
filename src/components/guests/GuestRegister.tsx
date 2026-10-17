"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {Alert,Box,Button,CircularProgress,Dialog,DialogActions,DialogContent,DialogTitle,MenuItem,TextField,Typography} from "@mui/material";
import Add from "@mui/icons-material/Add";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Refresh from "@mui/icons-material/Refresh";
import {currentSaturday,guestDetails,isSaturday,saturdayLabel,type GuestEntry} from "@/lib/guestTypes";

interface Row {key:string;value:GuestEntry;original?:GuestEntry;error?:string;saving?:boolean;requestId?:string}
function dirty(row:Row){return !row.original||row.value.name!==row.original.name||row.value.church!==row.original.church||row.value.pax!==row.original.pax||row.value.type!==row.original.type||(row.value.phone??"")!==(row.original.phone??"");}
function errorText(error:unknown,fallback:string){return error instanceof Error&&!(error instanceof TypeError)?error.message:fallback;}
export default function GuestRegister({initialDate,readOnly=false,invalidDate=false}:{initialDate:string;readOnly?:boolean;invalidDate?:boolean}){
  const [date,setDate]=useState(initialDate),[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[message,setMessage]=useState("");
  const [busy,setBusy]=useState(false),[deleting,setDeleting]=useState<Row|null>(null),[switchDate,setSwitchDate]=useState<string|null>(null),[reload,setReload]=useState(false),[shareUrl,setShareUrl]=useState(""),[lastUpdated,setLastUpdated]=useState("");
  const rowsRef=useRef(rows),busyRef=useRef(busy),generation=useRef(0);
  useEffect(()=>{rowsRef.current=rows;},[rows]);useEffect(()=>{busyRef.current=busy;},[busy]);
  const load=useCallback(async(signal?:AbortSignal,quiet=false)=>{
    const request=++generation.current;if(!quiet)setLoading(true);setError("");
    try{
      const response=await fetch(`/api/guests?date=${date}`,{cache:"no-store",signal});const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Daftar tamu belum dapat dimuat.");
      if(signal?.aborted||request!==generation.current)return;
      setRows(data.guests.map((value:GuestEntry)=>({key:value.id,value,original:value})));
      setLastUpdated(new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date()));
    }catch(error){if(!signal?.aborted&&request===generation.current)setError(errorText(error,"Daftar tamu belum dapat dimuat. Periksa koneksi lalu perbarui daftar."));}
    finally{if(!signal?.aborted&&request===generation.current)setLoading(false);}
  },[date]);
  useEffect(()=>{setRows([]);setMessage("");const controller=new AbortController();void load(controller.signal);return()=>controller.abort();},[load]);
  useEffect(()=>{
    const controller=new AbortController();
    const timer=window.setInterval(()=>{if(!document.hidden&&!busyRef.current&&(readOnly||!rowsRef.current.some(dirty)))void load(controller.signal,true);},readOnly?15000:30000);
    return()=>{window.clearInterval(timer);controller.abort();};
  },[load,readOnly]);
  useEffect(()=>{
    if(readOnly||!rows.some(dirty))return;
    const prevent=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",prevent);return()=>window.removeEventListener("beforeunload",prevent);
  },[rows,readOnly]);
  function update(key:string,changes:Partial<GuestEntry>){generation.current++;setRows(current=>current.map(row=>row.key===key?{...row,value:{...row.value,...changes},error:undefined}:row));}
  function add(){generation.current++;const id=crypto.randomUUID();setRows(current=>[...current,{key:`new-${id}`,requestId:id,value:{id:"",date,name:"",church:"",type:"individual",phone:"",pax:null,revision:"",createdAt:"",updatedAt:""}}]);}
  function chooseDate(next:string){if(!isSaturday(next)){setError("Pilih tanggal hari Sabtu.");return;}if(next===date)return;if(rows.some(dirty)){setSwitchDate(next);return;}setDate(next);}
  async function saveRow(row:Row){
    let details;
    try{details=guestDetails(row.value);}catch(error){setRows(current=>current.map(r=>r.key===row.key?{...r,error:(error as Error).message}:r));return false;}
    setRows(current=>current.map(r=>r.key===row.key?{...r,saving:true,error:undefined}:r));
    try{
      const response=await fetch(row.original?`/api/guests/${row.value.id}`:"/api/guests",{method:row.original?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...details,...(row.original?{revision:row.original.revision}:{requestId:row.requestId})})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Catatan belum tersimpan.");
      setRows(current=>current.map(r=>r.key===row.key?{key:row.key,value:data.guest,original:data.guest}:r));return true;
    }catch(error){setRows(current=>current.map(r=>r.key===row.key?{...r,saving:false,error:errorText(error,"Catatan belum tersimpan. Periksa koneksi lalu coba simpan kembali.")}:r));return false;}
  }
  async function save(selected?:Row){
    if(busy)return;setBusy(true);busyRef.current=true;generation.current++;setMessage("");
    let saved=0;const pending=selected?[selected]:rows.filter(dirty);
    try{for(const row of pending)if(await saveRow(row))saved++;if(saved)setMessage(`${saved} catatan berhasil disimpan dan dapat dibaca pembawa acara.`);}
    finally{setBusy(false);busyRef.current=false;}
  }
  async function remove(){
    if(!deleting)return;
    if(!deleting.original){setRows(current=>current.filter(row=>row.key!==deleting.key));setDeleting(null);return;}
    setBusy(true);busyRef.current=true;generation.current++;setError("");
    try{const response=await fetch(`/api/guests/${deleting.value.id}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({date,revision:deleting.original.revision})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Catatan belum dihapus.");setRows(current=>current.filter(row=>row.key!==deleting.key));setDeleting(null);setMessage("Catatan tamu telah dihapus.");}
    catch(error){setError(errorText(error,"Catatan belum dihapus. Periksa koneksi lalu coba lagi."));}finally{setBusy(false);busyRef.current=false;}
  }
  async function copyMcLink(){
    const url=`${window.location.origin}/tamu/mc?date=${date}`;setShareUrl(url);
    try{await navigator.clipboard.writeText(url);setMessage("Tautan baca untuk pembawa acara telah disalin.");}catch{setMessage("Salin tautan pembawa acara di kotak tautan.");}
  }
  async function copyList(){
    const text=[`Daftar Tamu — ${saturdayLabel(date)}`,"",...rows.filter(row=>row.original).map((row,index)=>`${index+1}. ${row.value.name} — ${row.value.church||"Jemaat asal belum dicatat"}${row.value.pax===null?"":` (${row.value.pax} orang)`}`)].join("\n");
    try{await navigator.clipboard.writeText(text);setMessage("Daftar tamu telah disalin.");}catch{setError("Belum dapat menyalin otomatis. Gunakan tautan baca pembawa acara.");}
  }
  const saved=rows.filter(row=>row.original);const pax=saved.reduce((sum,row)=>sum+(row.original!.pax??0),0);const unknownPax=saved.filter(row=>row.original!.pax===null).length;const unsaved=rows.filter(dirty).length;
  return <>
    <Typography component="h1" sx={{fontSize:{xs:"2.2rem",sm:"3rem"},fontWeight:350,mb:1}}>Daftar Tamu</Typography>
    <Typography color="text.secondary" sx={{mb:3,fontSize:"1.125rem"}}>{readOnly?"Daftar untuk dibacakan saat menyambut tamu. Tampilan ini hanya untuk membaca.":"Catat tamu perorangan atau keluarga untuk disambut oleh pembawa acara."}</Typography>
    {invalidDate&&<Alert severity="info" sx={{mb:2}}>Tanggal pada tautan tidak valid. Menampilkan Sabat terdekat.</Alert>}
    <Box className="guest-toolbar" sx={{display:"flex",gap:2,flexWrap:"wrap",alignItems:"center",mb:3}}>
      <TextField label="Tanggal Sabat" type="date" value={date} onChange={event=>chooseDate(event.target.value)} disabled={busy||loading} slotProps={{inputLabel:{shrink:true}}} helperText="Pilih hari Sabtu."/>
      <Button onClick={()=>chooseDate(currentSaturday())} disabled={busy||loading}>Sabat Terdekat</Button>
      <Button startIcon={<Refresh/>} disabled={busy||loading} onClick={()=>{if(rows.some(dirty))setReload(true);else void load();}}>Perbarui Daftar</Button>
      {!readOnly&&<Button startIcon={<ContentCopy/>} onClick={()=>void copyMcLink()} disabled={busy}>Salin Tautan MC</Button>}
      {readOnly&&<Button startIcon={<ContentCopy/>} onClick={()=>void copyList()} disabled={loading||!saved.length}>Salin Daftar</Button>}
    </Box>
    <Typography component="h2" sx={{fontSize:"1.35rem",fontWeight:450,mb:1}}>{saturdayLabel(date)}</Typography>
    <Typography role="status" color="text.secondary" sx={{mb:3}}>{saved.length} catatan tamu · {pax} orang tercatat{unknownPax?` · ${unknownPax} catatan tanpa jumlah orang`:""}{unsaved&&!readOnly?` · ${unsaved} catatan belum disimpan`:""}</Typography>
    {shareUrl&&<TextField label="Tautan baca untuk MC" value={shareUrl} fullWidth sx={{mb:3}} slotProps={{input:{readOnly:true}}} onFocus={event=>event.target.select()}/>}
    {message&&<Alert severity="success" sx={{mb:3}} onClose={()=>setMessage("")}>{message}</Alert>}
    {error&&<Alert severity="error" sx={{mb:3}} onClose={()=>setError("")}>{error}</Alert>}
    {loading?<Box sx={{py:6,textAlign:"center"}}><CircularProgress aria-label="Memuat daftar tamu"/></Box>:<>
      <table className={`guest-table${readOnly?" guest-table-readonly":""}`} aria-label={`Daftar tamu ${saturdayLabel(date)}`}>
        <thead><tr><th scope="col">Jenis Tamu</th><th scope="col">Nama / Keluarga</th><th scope="col">Jemaat Asal</th><th scope="col">Nomor HP</th><th scope="col">Jumlah Orang</th>{!readOnly&&<th scope="col">Tindakan</th>}</tr></thead>
        <tbody>{rows.map((row,index)=><tr key={row.key}>
          <td><span className="guest-cell-label">Jenis Tamu</span>{readOnly?row.value.type==="group"?"Keluarga / Rombongan":"Perorangan":<TextField select fullWidth value={row.value.type} disabled={busy} slotProps={{select:{renderValue:value=>value==="group"?"Rombongan":"Perorangan",inputProps:{"aria-label":`Jenis tamu baris ${index+1}`}}}} onChange={event=>update(row.key,{type:event.target.value as GuestEntry["type"],pax:row.value.pax===null?null:event.target.value==="individual"?1:Math.max(2,row.value.pax)})}><MenuItem value="individual">Perorangan</MenuItem><MenuItem value="group">Keluarga / Rombongan</MenuItem></TextField>}</td>
          <td><span className="guest-cell-label">Nama / Keluarga</span>{readOnly?<strong>{row.value.name}</strong>:<TextField fullWidth value={row.value.name} disabled={busy} placeholder={row.value.type==="group"?"Kel. John Doe":"Nama tamu"} slotProps={{htmlInput:{"aria-label":`Nama tamu baris ${index+1}`,maxLength:150}}} onChange={event=>update(row.key,{name:event.target.value})}/>}</td>
          <td><span className="guest-cell-label">Jemaat Asal</span>{readOnly?row.value.church||"—":<TextField fullWidth value={row.value.church} disabled={busy} placeholder="Jemaat asal" slotProps={{htmlInput:{"aria-label":`Jemaat asal baris ${index+1}`,maxLength:150}}} onChange={event=>update(row.key,{church:event.target.value})}/>}</td>
          <td><span className="guest-cell-label">Nomor HP</span>{readOnly?row.value.phone||"—":<TextField fullWidth type="tel" value={row.value.phone??""} disabled={busy} placeholder="Nomor HP" slotProps={{htmlInput:{"aria-label":`Nomor HP baris ${index+1}`,inputMode:"numeric",pattern:"[0-9]*"}}} onChange={event=>update(row.key,{phone:event.target.value.replace(/[^0-9]/g,"")})}/>}</td>
          <td><span className="guest-cell-label">Jumlah Orang</span>{readOnly?<span className="guest-pax">{row.value.pax??"—"}</span>:<TextField type="number" value={row.value.pax??""} placeholder="Opsional" disabled={busy} slotProps={{htmlInput:{"aria-label":`Jumlah orang baris ${index+1}`,min:row.value.type==="individual"?1:2,max:row.value.type==="individual"?1:999,step:1,inputMode:"numeric"}}} onChange={event=>update(row.key,{pax:event.target.value===""?null:Number(event.target.value)})}/>}</td>
          {!readOnly&&<td className="guest-row-actions"><Button onClick={()=>void save(row)} disabled={busy||!dirty(row)}>{row.saving?"Menyimpan…":"Simpan"}</Button><Button color="error" onClick={()=>{setError("");setDeleting(row);}} disabled={busy}>Hapus</Button>{dirty(row)&&<Typography variant="body2" color="text.secondary">Belum disimpan</Typography>}{row.error&&<Typography role="alert" color="error" variant="body2">{row.error}</Typography>}</td>}
        </tr>)}</tbody>
      </table>
      {!rows.length&&<Typography color="text.secondary" sx={{py:4}}>{readOnly?"Belum ada tamu yang dicatat untuk Sabat ini.":"Belum ada catatan tamu. Pilih Tambah Tamu untuk mulai mengisi."}</Typography>}
      {!readOnly&&<Box sx={{display:"flex",gap:2,flexWrap:"wrap",mt:3}}><Button variant="outlined" startIcon={<Add/>} disabled={busy||Boolean(error)} onClick={add}>Tambah Tamu</Button><Button variant="contained" disabled={busy||!unsaved} onClick={()=>void save()}>{busy?"Menyimpan…":"Simpan Semua Perubahan"}</Button></Box>}
    </>}
    <Typography color="text.secondary" variant="body2" sx={{mt:3}}>{readOnly?"Diperbarui otomatis setiap 15 detik.":"Simpan setelah mengisi. Catatan yang belum disimpan belum terlihat oleh MC."}{lastUpdated?` Terakhir diperbarui ${lastUpdated} WIB.`:""}</Typography>
    <Dialog open={Boolean(deleting)} onClose={busy?undefined:()=>setDeleting(null)} aria-labelledby="guest-delete-title"><DialogTitle id="guest-delete-title">Hapus Catatan Tamu?</DialogTitle><DialogContent><Typography>{deleting?.value.name||"Baris tamu kosong"}</Typography><Typography sx={{mt:2}}>Catatan ini akan hilang dari daftar penerima tamu dan MC.</Typography>{error&&<Alert severity="error" sx={{mt:2}}>{error}</Alert>}</DialogContent><DialogActions><Button disabled={busy} onClick={()=>setDeleting(null)}>Batal</Button><Button variant="contained" color="error" disabled={busy} onClick={()=>void remove()}>Hapus</Button></DialogActions></Dialog>
    <Dialog open={Boolean(switchDate)||reload} onClose={()=>{setSwitchDate(null);setReload(false);}} aria-labelledby="guest-discard-title"><DialogTitle id="guest-discard-title">Ada Perubahan Belum Disimpan</DialogTitle><DialogContent><Typography>Jika melanjutkan, isian yang belum disimpan akan dibuang. Pilih Batal untuk menyimpannya terlebih dahulu.</Typography></DialogContent><DialogActions><Button onClick={()=>{setSwitchDate(null);setReload(false);}}>Batal</Button><Button onClick={()=>{if(switchDate)setDate(switchDate);else void load();setSwitchDate(null);setReload(false);}}>Lanjutkan</Button></DialogActions></Dialog>
  </>;
}
