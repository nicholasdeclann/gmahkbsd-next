"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";

interface PrayerItem {
  id: number;
  name: string;
  note: string | null;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<PrayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
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
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const url = editingId ? `/api/prayer/${editingId}` : "/api/prayer";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, note }),
    });
    if (res.status === 401) return router.push("/admin/login");
    if (res.ok) {
      resetForm();
      load();
    } else {
      setError("Gagal menyimpan");
    }
  };

  const startEdit = (item: PrayerItem) => {
    setEditingId(item.id);
    setName(item.name);
    setNote(item.note ?? "");
  };

  const remove = async (id: number) => {
    const res = await fetch(`/api/prayer/${id}`, { method: "DELETE" });
    if (res.status === 401) return router.push("/admin/login");
    if (res.ok) load();
  };

  const clearOld = async () => {
    const res = await fetch("/api/prayer/manage", { method: "DELETE" });
    if (res.status === 401) return router.push("/admin/login");
    if (res.ok) load();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Pokok Doa Minggu Ini
        </Typography>
        <Button onClick={logout} size="small" color="inherit">
          Keluar
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 3 }}
      >
        <TextField
          label="Nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          fullWidth
          required
        />
        <TextField
          label="Catatan (opsional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          size="small"
          fullWidth
        />
        <Button type="submit" variant="contained" sx={{ whiteSpace: "nowrap" }}>
          {editingId ? "Simpan" : "Tambah"}
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
              (() => {
                const s = new Date();
                s.setDate(s.getDate() - s.getDay());
                s.setHours(0, 0, 0, 0);
                return s;
              })();
            return (
              <ListItem
                key={item.id}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  mb: 1,
                  opacity: isOld ? 0.55 : 1,
                }}
                secondaryAction={
                  <>
                    <IconButton edge="end" onClick={() => startEdit(item)} size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" onClick={() => remove(item.id)} size="small">
                      <Delete fontSize="small" />
                    </IconButton>
                  </>
                }
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
                      {item.note}
                    </Typography>
                  )}
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
