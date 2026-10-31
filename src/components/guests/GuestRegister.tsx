"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Menu, MenuItem, TextField, Typography, useMediaQuery } from "@mui/material";
import GuestShell from "./GuestShell";
import GuestPaxField from "./GuestPaxField";
import GlassDialog from "../ui/glass/GlassDialog";
import ConfirmDialog from "../ui/glass/ConfirmDialog";
import { GlassButton, GlassSegmented } from "../ui/glass/GlassControls";
import { Add, ContentCopy, Refresh, SaveOutlined, TodayOutlined, DeleteOutlined } from "../ui/icons";
import { useLanguage } from "../LanguageProvider";
import { useActionNotice, useNotifications } from "../ui/notifications/NotificationProvider";
import { currentSaturday, guestDetails, isSaturday, type GuestEntry } from "@/lib/guestTypes";
import { guestHref, guestLocation, type GuestLocation } from "@/lib/guestNavigation";
import { historyIndex, registerHistoryGuard } from "@/lib/historyIndex";
import "./guests.css";

interface Row { key: string; value: GuestEntry; original?: GuestEntry; error?: string; requestId?: string }
interface Editor { row: Row; initial: string }
const editableValue = (value: GuestEntry) => JSON.stringify([value.name, value.church, value.type, value.phone ?? "", value.pax]);
const dirty = (row: Row) => !row.original || editableValue(row.value) !== editableValue(row.original);
const errorText = (error: unknown, fallback: string) => error instanceof Error && !(error instanceof TypeError) ? error.message : fallback;

export default function GuestRegister({ initialLocation, authenticated, demo, invalidDate = false, invalidView = false }: { initialLocation: GuestLocation; authenticated: boolean; demo: boolean; invalidDate?: boolean; invalidView?: boolean }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { notify } = useNotifications();
  const desktop = useMediaQuery("(min-width:1024px)");
  const [selected, setSelected] = useState(initialLocation);
  const readOnly = selected.view === "mc", date = selected.date;
  const [rows, setRows] = useState<Row[]>([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useActionNotice("error", "guest-action");
  const [, setMessage] = useActionNotice("success", "guest-success");
  const [editor, setEditor] = useState<Editor | null>(null), [deleting, setDeleting] = useState<Row | null>(null);
  const [dateOpen, setDateOpen] = useState(false), [dateDraft, setDateDraft] = useState(date);
  const [more, setMore] = useState<HTMLElement | null>(null);
  const [shareUrl, setShareUrl] = useState(""), [lastUpdated, setLastUpdated] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false), [keyboardOpen, setKeyboardOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null), generation = useRef(0), alive = useRef(true), busyRef = useRef(false);
  const draftsRef = useRef(false);
  const historyRef = useRef({ index: 0, url: guestHref(initialLocation) });
  const restoringPop = useRef(false), allowPop = useRef(false);
  const rowDrafts = rows.filter(dirty).length;
  const editorDirty = Boolean(editor && editableValue(editor.row.value) !== editor.initial);
  const hasDrafts = rowDrafts > 0 || editorDirty;
  draftsRef.current = hasDrafts; busyRef.current = busy;

  function requestAction(action: () => void) {
    if (busyRef.current) return;
    if (draftsRef.current) { pending.current = action; setConfirmDiscard(true); }
    else action();
  }
  function discardDrafts() { setEditor(null); setRows(current => current.filter(row => row.original).map(row => ({ ...row, value: row.original!, error: undefined }))); setError(""); }
  function commitLocation(next: GuestLocation) {
    const url = guestHref(next); if (url === historyRef.current.url) return;
    const index = (historyIndex(history.state) ?? historyRef.current.index) + 1;
    window.history.pushState({ ...window.history.state }, "", url);
    historyRef.current = { index, url }; setSelected(next);
  }
  function navigate(href: string) {
    const url = new URL(href, location.origin);
    requestAction(() => { discardDrafts(); if (url.pathname === "/tamu") commitLocation(guestLocation(url.searchParams.get("view"), url.searchParams.get("date"))); else router.push(url.pathname + url.search + url.hash); });
  }
  useEffect(() => {
    alive.current = true;
    const index = historyIndex(history.state) ?? 0;
    const canonical = guestHref(initialLocation); history.replaceState({ ...history.state }, "", canonical); historyRef.current = { index, url: canonical };
    if (invalidDate) notify({ type: "info", key: "guest-invalid-url", message: "Tanggal pada tautan tidak valid. Menampilkan Sabat terdekat." });
    else if (invalidView) notify({ type: "info", key: "guest-invalid-url", message: "Tampilan pada tautan tidak valid. Menampilkan Penerima Tamu." });
    const pop = (event: PopStateEvent) => {
      if (restoringPop.current) { event.stopImmediatePropagation(); restoringPop.current = false; return; }
      const nextUrl = new URL(location.href), index = historyIndex(event.state) ?? historyRef.current.index - 1;
      const delta = index - historyRef.current.index || -1;
      if (busyRef.current) { event.stopImmediatePropagation(); restoringPop.current = true; history.go(-delta); return; }
      if (draftsRef.current && !allowPop.current) {
        event.stopImmediatePropagation(); restoringPop.current = true; history.go(-delta);
        pending.current = () => { allowPop.current = true; history.go(delta); }; setConfirmDiscard(true); return;
      }
      allowPop.current = false;
      if (nextUrl.pathname === "/tamu") {
        const next = guestLocation(nextUrl.searchParams.get("view"), nextUrl.searchParams.get("date"));
        historyRef.current = { index, url: guestHref(next) }; setSelected(next);
      }
    };
    const unregister = registerHistoryGuard(pop);
    return () => { alive.current = false; unregister(); generation.current++; };
  }, []);
  useEffect(() => {
    if (!hasDrafts) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [hasDrafts]);
  useEffect(() => {
    const viewport = window.visualViewport; if (!viewport) return;
    let baseline = Math.max(innerHeight, viewport.height), frame = 0;
    const measure = () => {
      const editing = document.activeElement?.matches("input,textarea,[contenteditable=true]") ?? false;
      if (!editing && viewport.scale === 1 && viewport.height >= innerHeight - 80) baseline = Math.max(innerHeight, viewport.height);
      setKeyboardOpen(editing && (viewport.scale > 1.05 || Math.max(innerHeight, baseline) - viewport.height > 140));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    viewport.addEventListener("resize", schedule); window.addEventListener("resize", schedule); document.addEventListener("focusin", schedule); document.addEventListener("focusout", schedule);
    return () => { cancelAnimationFrame(frame); viewport.removeEventListener("resize", schedule); window.removeEventListener("resize", schedule); document.removeEventListener("focusin", schedule); document.removeEventListener("focusout", schedule); };
  }, []);

  const load = useCallback(async (signal?: AbortSignal, quiet = false) => {
    const request = ++generation.current;
    if (!quiet) { setLoading(true); setError(""); }
    try {
      const response = await fetch(`/api/guests?date=${date}`, { cache: "no-store", signal }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Daftar tamu belum dapat dimuat.");
      if (!alive.current || signal?.aborted || request !== generation.current || quiet && draftsRef.current) return;
      setRows(data.guests.map((value: GuestEntry) => ({ key: value.id, value, original: value })));
      setError(""); setLastUpdated(new Intl.DateTimeFormat(language === "en" ? "en-GB" : "id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    } catch (error) { if (alive.current && !quiet && !signal?.aborted && request === generation.current) setError(errorText(error, "Daftar tamu belum dapat dimuat. Periksa koneksi lalu perbarui daftar.")); }
    finally { if (alive.current && !signal?.aborted && request === generation.current) setLoading(false); }
  }, [date]);
  useEffect(() => { setRows([]); setEditor(null); const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setInterval(() => { if (!document.hidden && !busyRef.current && !draftsRef.current) void load(controller.signal, true); }, readOnly ? 15000 : 30000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [load, readOnly]);
  const labelDate = (date: string, short = false) => new Intl.DateTimeFormat(language === "en" ? "en-GB" : "id-ID", { timeZone: "Asia/Jakarta", weekday: "short", day: "numeric", month: short ? "short" : "long", ...(short ? {} : { year: "numeric" as const }) }).format(new Date(`${date}T12:00:00+07:00`));
  function update(key: string, changes: Partial<GuestEntry>) { generation.current++; setRows(current => current.map(row => row.key === key ? { ...row, value: { ...row.value, ...changes }, error: undefined } : row)); }
  function edit(row: Row) { requestAction(() => { setError(""); const savedValue = row.original ?? row.value; const value = { ...savedValue, pax: savedValue.pax ?? 1 }; setEditor({ row: { ...row, value: { ...value } }, initial: editableValue(value) }); }); }
  function add() {
    requestAction(() => {
      setError(""); const id = crypto.randomUUID(); const row: Row = { key: `new-${id}`, requestId: id, value: { id: "", date, name: "", church: "", type: "individual", phone: "", pax: 1, revision: "", createdAt: "", updatedAt: "" } };
      setEditor({ row, initial: editableValue(row.value) });
    });
  }
  function updateEditor(changes: Partial<GuestEntry>) { setEditor(current => current ? { ...current, row: { ...current.row, value: { ...current.row.value, ...changes }, error: undefined } } : current); setError(""); }
  async function saveRow(row: Row): Promise<boolean> {
    let details;
    try { const pax = row.value.pax ?? 1; details = guestDetails({ ...row.value, pax, type: pax > 1 ? "group" : "individual" }); } catch (error) { const message = (error as Error).message; setError(message); setRows(current => current.map(r => r.key === row.key ? { ...r, error: message } : r)); return false; }
    try {
      const response = await fetch(row.original ? `/api/guests/${row.value.id}` : "/api/guests", { method: row.original ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...details, ...(row.original ? { revision: row.original.revision } : { requestId: row.requestId }) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Catatan belum tersimpan."); if (!alive.current) return false;
      const next: Row = { key: data.guest.id, value: data.guest, original: data.guest };
      setRows(current => current.some(r => r.key === row.key) ? current.map(r => r.key === row.key ? next : r) : [...current, next]); return true;
    } catch (error) { if (alive.current) setError(errorText(error, "Catatan belum tersimpan. Periksa koneksi lalu coba simpan kembali.")); return false; }
  }
  async function save(selectedRow?: Row, fromEditor = false) {
    if (busyRef.current || readOnly) return;
    busyRef.current = true; setBusy(true); generation.current++; setError(""); setMessage("");
    let count = 0;
    try { for (const row of selectedRow ? [selectedRow] : rows.filter(dirty)) if (await saveRow(row)) count++;
      if (count) { if (fromEditor) setEditor(null); setMessage(`${count} ${t("catatan berhasil disimpan dan dapat dibaca pembawa acara.")}`); }
    } finally { if (alive.current) setBusy(false); busyRef.current = false; }
  }
  async function remove() {
    if (!deleting || busyRef.current) return; busyRef.current = true; setBusy(true); generation.current++; setError("");
    try {
      if (deleting.original) { const response = await fetch(`/api/guests/${deleting.value.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, revision: deleting.original.revision }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Catatan belum dihapus."); }
      setRows(current => current.filter(row => row.key !== deleting.key)); if (editor?.row.key === deleting.key) setEditor(null); setDeleting(null); setMessage("Catatan tamu telah dihapus.");
    } catch (error) { setError(errorText(error, "Catatan belum dihapus. Periksa koneksi lalu coba lagi.")); }
    finally { setBusy(false); busyRef.current = false; }
  }
  async function copyLink(view = selected.view) {
    setMore(null); const url = new URL(guestHref({ view, date }), location.origin).toString();
    try { await navigator.clipboard.writeText(url); setMessage("Tautan daftar tamu telah disalin."); } catch { setShareUrl(url); notify({ type: "info", key: "guest-link", message: "Salin tautan dari kolom yang tersedia." }); }
  }
  const saved = rows.flatMap(row => row.original ? [row.original] : []), pax = saved.reduce((sum, row) => sum + (row.pax ?? 0), 0), unknownPax = saved.filter(row => row.pax === null).length;
  async function copyList() {
    const text = [t("Daftar Tamu") + " — " + labelDate(date), "", ...saved.map((row, index) => `${index + 1}. ${row.name} — ${row.church || t("Jemaat asal belum dicatat")}${row.pax === null ? "" : ` (${row.pax} ${t("orang")})`}`)].join("\n");
    try { await navigator.clipboard.writeText(text); setMessage("Daftar tamu telah disalin."); } catch { setError("Belum dapat menyalin otomatis. Gunakan tautan baca pembawa acara."); }
  }
  function refresh() { requestAction(() => { discardDrafts(); void load(); }); }

  return <GuestShell view={selected.view} authenticated={authenticated} demo={demo} onNavigate={navigate}>
    <div className={`guest-workspace${keyboardOpen ? " guest-workspace--keyboard" : ""}`}>
      <Typography component="h1" variant="h4" sx={{ mb: 2 }}>{t("Daftar Tamu")}</Typography>
      <div className="guest-workspace-toolbar" data-notification-offset>
        <GlassSegmented panelId="guest-view-panel" label={t("Tampilan daftar tamu")} options={[{value:"usher",label:t("Penerima Tamu")},{value:"mc",label:"MC"}]} value={selected.view} onChange={view => requestAction(()=>{discardDrafts();commitLocation({...selected,view:view as GuestLocation["view"]});})}/>
        <GlassButton startIcon={<TodayOutlined/>} aria-haspopup="dialog" disabled={busy} onClick={()=>{setDateDraft(date);setDateOpen(true);}}>{labelDate(date,true)}</GlassButton>
      </div>
      <div className="guest-totals" role="status"><span><strong>{saved.length}</strong> {t("catatan tamu")}</span><span><strong>{pax}</strong> {t("orang tercatat")}</span>{unknownPax>0&&<span>{unknownPax} {t("catatan tanpa jumlah orang")}</span>}{rowDrafts>0&&<span>{rowDrafts} {t("belum disimpan")}</span>}</div>
      <div id="guest-view-panel" role="tabpanel" aria-labelledby={`guest-view-panel-${selected.view}`}>
        {loading ? <Box sx={{py:5,textAlign:"center"}}><CircularProgress aria-label={t("Memuat daftar tamu")}/></Box> : <>
          {!rows.length && <Typography color="text.secondary" sx={{py:4}}>{t(readOnly ? "Belum ada tamu yang dicatat untuk Sabat ini." : "Belum ada catatan tamu. Pilih Tambah untuk mulai.")}</Typography>}
          {desktop ? <div className="guest-table-scroller"><table className={`guest-data-table${readOnly?" guest-data-table--mc":""}`} aria-label={t("Daftar Tamu")+" "+labelDate(date)}><thead><tr>{(readOnly?["Nama / Keluarga","Jemaat Asal","Jumlah Orang"]:["Nama / Keluarga","Jemaat Asal","Nomor HP","Jumlah Orang","Tindakan"]).map(label=><th key={label} scope="col">{t(label)}</th>)}</tr></thead><tbody>
            {(readOnly ? rows.filter(row=>row.original) : rows).map((row,index)=>{const value=readOnly?row.original!:row.value;return <tr key={row.key}>
              <td>{readOnly?<strong>{value.name}</strong>:<TextField size="small" fullWidth value={value.name} error={Boolean(row.error)&&!value.name.trim()} disabled={busy} slotProps={{htmlInput:{"aria-label":t("Nama / Keluarga")+` ${index+1}`,maxLength:150}}} onChange={event=>update(row.key,{name:event.target.value})}/>}</td>
              <td>{readOnly?value.church||"—":<TextField size="small" fullWidth value={value.church} disabled={busy} slotProps={{htmlInput:{"aria-label":t("Jemaat Asal")+` ${index+1}`,maxLength:150}}} onChange={event=>update(row.key,{church:event.target.value})}/>}</td>
              {!readOnly&&<td><TextField size="small" type="tel" fullWidth value={value.phone??""} disabled={busy} slotProps={{htmlInput:{"aria-label":t("Nomor HP")+` ${index+1}`,inputMode:"numeric"}}} onChange={event=>update(row.key,{phone:event.target.value.replace(/[^0-9]/g,"")})}/></td>}
              <td>{readOnly?value.pax??"—":<GuestPaxField value={value.pax??1} disabled={busy} ariaLabel={t("Jumlah Orang")+` ${index+1}`} onChange={pax=>update(row.key,{pax})}/>}</td>
              {!readOnly&&<td><div className="guest-desktop-row-actions"><GlassButton tone="plain" disabled={busy||!dirty(row)} onClick={()=>void save(row)}>{t("Simpan")}</GlassButton><GlassButton tone="danger-quiet" disabled={busy} onClick={()=>setDeleting(row)}>{t("Hapus")}</GlassButton></div>{dirty(row)&&<small>{t("Belum disimpan")}</small>}</td>}
            </tr>;})}
          </tbody></table></div> : <div className={`guest-summary-cards${readOnly?" guest-summary-cards--mc":""}`}>
            {(readOnly?rows.filter(row=>row.original):rows).map((row,index)=>{const value=readOnly?row.original!:row.value;const content=<><span className="guest-summary-number">{index+1}</span><span className="guest-summary-person"><strong>{value.name||t("Nama tamu")}</strong><span>{value.church||t("Jemaat asal belum dicatat")}</span>{!readOnly&&dirty(row)&&<small>{t("Belum disimpan")}</small>}</span><span className="guest-summary-pax"><strong>{value.pax??"—"}</strong><small>{t("orang")}</small></span></>;return readOnly?<article key={row.key} className="guest-summary-card">{content}</article>:<button type="button" key={row.key} className="guest-summary-card" disabled={busy} onClick={()=>edit(row)} aria-label={t("Edit tamu")+": "+value.name}>{content}</button>;})}
          </div>}
        </>}
      </div>
      <Typography className="guest-sync-note" variant="body2" color="text.secondary">{t(readOnly?"Diperbarui otomatis setiap 15 detik.":"Perubahan terlihat oleh MC setelah disimpan.")}{lastUpdated?` · ${lastUpdated} WIB`:""}</Typography>
      <div className="guest-action-bar" role="group" aria-label={t("Tindakan daftar tamu")}>
        {readOnly?<GlassButton tone="primary" startIcon={<ContentCopy/>} disabled={busy||loading||!saved.length} onClick={()=>void copyList()}>{t("Salin Daftar")}</GlassButton>:<GlassButton tone="primary" startIcon={<Add/>} disabled={busy||loading} onClick={add}>{t("Tambah")}</GlassButton>}
        {desktop&&!readOnly&&<GlassButton startIcon={<SaveOutlined/>} disabled={busy||!rowDrafts} onClick={()=>void save()}>{t(busy?"Menyimpan…":"Simpan")}</GlassButton>}
        <GlassButton startIcon={<Refresh/>} disabled={busy||loading} onClick={refresh}>{t("Refresh")}</GlassButton>
        <GlassButton tone="plain" id="guest-more-trigger" aria-haspopup="menu" aria-expanded={Boolean(more)} disabled={busy} onClick={event=>setMore(event.currentTarget)}>{t("Lainnya")}</GlassButton>
      </div>
      <Menu anchorEl={more} open={Boolean(more)} onClose={()=>setMore(null)} slotProps={{list:{"aria-labelledby":"guest-more-trigger"}}}>
        <MenuItem onClick={()=>void copyLink()}>{t("Salin Tautan Tampilan Ini")}</MenuItem>{!readOnly&&<MenuItem onClick={()=>void copyLink("mc")}>{t("Salin Tautan MC")}</MenuItem>}
      </Menu>
      <GlassDialog open={dateOpen} onClose={()=>setDateOpen(false)} title="Tanggal Sabat" busy={busy} actions={<><GlassButton tone="glass" startIcon={<TodayOutlined/>} onClick={()=>setDateDraft(currentSaturday())}>{t("Sabat Terdekat")}</GlassButton><GlassButton tone="primary" onClick={()=>{if(!isSaturday(dateDraft)){setError("Pilih tanggal hari Sabtu.");return;}setDateOpen(false);requestAction(()=>{discardDrafts();commitLocation({...selected,date:dateDraft});});}}>{t("Terapkan")}</GlassButton></>}>
        <TextField type="date" label={t("Tanggal Sabat")} fullWidth value={dateDraft} onChange={event=>setDateDraft(event.target.value)} slotProps={{inputLabel:{shrink:true}}} helperText={t("Pilih hari Sabtu.")}/>
      </GlassDialog>
      <GlassDialog open={Boolean(editor)} onClose={()=>requestAction(()=>{setEditor(null);setError("");})} title={editor?.row.original?"Edit tamu":"Tambah Tamu"} busy={busy} size="md" actions={<><GlassButton tone="primary" startIcon={<SaveOutlined/>} disabled={busy||!editor||Boolean(editor.row.original)&&!dirty(editor.row)} onClick={()=>editor&&void save(editor.row,true)}>{t(busy?"Menyimpan…":"Simpan")}</GlassButton></>}>
        {editor&&<div className="guest-edit-fields">
          <TextField label={t("Nama / Keluarga")} value={editor.row.value.name} required error={Boolean(error)&&!editor.row.value.name.trim()} disabled={busy} autoFocus slotProps={{htmlInput:{maxLength:150,"data-initial-focus":"true"}}} onChange={event=>updateEditor({name:event.target.value})}/>
          <TextField label={t("Jemaat Asal")} value={editor.row.value.church} disabled={busy} slotProps={{htmlInput:{maxLength:150}}} onChange={event=>updateEditor({church:event.target.value})}/>
          <TextField type="tel" label={t("Nomor HP")} value={editor.row.value.phone??""} disabled={busy} slotProps={{htmlInput:{inputMode:"numeric"}}} onChange={event=>updateEditor({phone:event.target.value.replace(/[^0-9]/g,"")})}/>
          <GuestPaxField label={t("Jumlah Orang")} value={editor.row.value.pax} disabled={busy} onChange={pax=>updateEditor({pax})}/>
          {editor.row.original&&<GlassButton tone="danger" startIcon={<DeleteOutlined/>} disabled={busy} onClick={()=>setDeleting(editor.row)}>{t("Hapus")}</GlassButton>}
        </div>}
      </GlassDialog>
      <GlassDialog open={Boolean(shareUrl)} onClose={()=>setShareUrl("")} title="Salin Tautan" actions={<GlassButton tone="plain" onClick={()=>setShareUrl("")}>{t("Tutup")}</GlassButton>}><TextField fullWidth label={t("Tautan daftar tamu")} value={shareUrl} slotProps={{input:{readOnly:true}}} onFocus={event=>event.target.select()}/></GlassDialog>
      <ConfirmDialog open={Boolean(deleting)} onClose={()=>setDeleting(null)} onConfirm={()=>void remove()} title="Hapus Catatan Tamu?" subject={deleting?.value.name} message="Catatan ini akan hilang dari daftar penerima tamu dan MC." confirmLabel="Hapus" busy={busy}/>
      <ConfirmDialog open={confirmDiscard} onClose={()=>{setConfirmDiscard(false);pending.current=null;}} onConfirm={()=>{const action=pending.current;pending.current=null;setConfirmDiscard(false);discardDrafts();draftsRef.current=false;action?.();}} title="Ada Perubahan Belum Disimpan" message="Jika melanjutkan, isian yang belum disimpan akan dibuang. Tutup dialog untuk menyimpannya terlebih dahulu." confirmLabel="Lanjutkan" tone="primary"/>
    </div>
  </GuestShell>;
}
