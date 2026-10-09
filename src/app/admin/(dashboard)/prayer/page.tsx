"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { churchWeekStart } from "@/lib/kertasAcaraForm";

interface PrayerItem {
  id: number;
  name: string;
  note: string | null;
  note_public: boolean;
  created_at: string;
}

export default function PrayerAdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<PrayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [notePublic, setNotePublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/prayer/manage", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Gagal memuat");
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setName("");
    setNote("");
    setNotePublic(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (saving) return;
    setSaving(true);
    setError("");
    try {
    const url = editingId ? `/api/prayer/${editingId}` : "/api/prayer";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, note, note_public: notePublic }),
    });
    if (res.status === 401) { setError("Sesi telah berakhir. Masuk kembali dari dashboard di tab baru. Isian Anda tetap tersedia."); return; }
    if (res.ok) {
      resetForm();
      load();
    } else {
      setError("Gagal menyimpan");
    }
    } catch { setError("Gagal menyimpan. Isian Anda tetap tersedia."); }
    finally { setSaving(false); }
  };

  const startEdit = (item: PrayerItem) => {
    setEditingId(item.id);
    setName(item.name);
    setNote(item.note ?? "");
    setNotePublic(item.note_public);
  };

  const remove = async (id: number) => {
    if (!window.confirm("Hapus nama ini dari daftar doa?")) return;
    try {
    const res = await fetch(`/api/prayer/${id}`, { method: "DELETE" });
    if (res.status === 401) return router.push("/admin/login");
    if (res.ok) load();
    else setError("Gagal menghapus nama.");
    } catch { setError("Gagal menghapus nama. Coba lagi."); }
  };

  const clearOld = async () => {
    if (!window.confirm("Hapus semua entri sebelum minggu ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
    const res = await fetch("/api/prayer/manage", { method: "DELETE" });
    if (res.status === 401) return router.push("/admin/login");
    if (res.ok) load();
    else setError("Gagal menghapus entri lama.");
    } catch { setError("Gagal menghapus entri lama. Coba lagi."); }
  };

  return (
    <Container maxWidth="md" disableGutters>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 750 }}>
          Pokok Doa Minggu Ini
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2.5, mb: 3, bgcolor: "white", p: 3, border: "1px solid #dce4ed", borderRadius: 3 }}
      >
        <TextField
          label="Nama"
          value={name}
          disabled={saving}
          slotProps={{ htmlInput: { maxLength: 200 } }}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Catatan (opsional)"
          value={note}
          disabled={saving}
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
          onChange={(e) => setNote(e.target.value)}
          fullWidth
        />
        <FormControlLabel control={<Checkbox checked={notePublic} onChange={event => setNotePublic(event.target.checked)} disabled={saving} />} label="Tampilkan catatan di website" />
        <Typography variant="body2" color="text.secondary">Nama ditampilkan di website untuk minggu ini. Catatan hanya ditampilkan jika dicentang.</Typography>
        <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: "flex-start" }}>
          {saving ? "Menyimpan…" : editingId ? "Simpan Perubahan" : "Tambah Nama"}
        </Button>
        {editingId && (
          <Button onClick={resetForm} color="inherit" sx={{ whiteSpace: "nowrap" }}>
            Batal
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <List>
          {items.length === 0 && (
            <Typography sx={{ color: "#6c757d", py: 2 }}>
              Belum ada data.
            </Typography>
          )}
          {items.map((item) => {
            const isOld =
              new Date(item.created_at) <
              new Date(churchWeekStart());
            return (
              <ListItem
                key={item.id}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  mb: 1,
                  opacity: isOld ? 0.55 : 1,
                  flexDirection: "column",
                  alignItems: "stretch",
                  bgcolor: "white",
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>
                    {item.name}
                    {isOld && (
                      <Typography component="span" sx={{ fontSize: "0.7rem", color: "#999", ml: 1 }}>
                        (minggu lalu)
                      </Typography>
                    )}
                  </Typography>
                  {item.note && (
                    <Typography sx={{ fontSize: "0.85rem", color: "#6c757d" }}>
                      {item.note} {!item.note_public && "(hanya untuk pengelola)"}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Button onClick={() => startEdit(item)} disabled={saving}>Edit</Button>
                  <Button onClick={() => void remove(item.id)} color="error" disabled={saving}>Hapus</Button>
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}

      <Button onClick={clearOld} color="error" size="small" sx={{ mt: 2 }}>
        Hapus entri minggu lalu
      </Button>
    </Container>
  );
}
