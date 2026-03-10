import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Pencil, Save, X, Upload, Radio, ArrowLeft, Loader2, RefreshCw, CheckCircle, Sparkles, Download, FolderOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";

const SESSION_KEY = "pachi_admin_pin_ok";

const STATION = "pachi_gutierrez_dj";
const SCHEDULE_API = `https://a6.asurahosting.com/api/station/${STATION}/schedule`;

function pad(n) { return String(n).padStart(2, "0"); }
function tsToTime(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY_EDIT = { description: "", image_url: "", dj_name: "", genre: "" };

export default function Admin() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [pinAuthed, setPinAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  // Data
  const [azuraShows, setAzuraShows] = useState([]); // unique shows from AzuraCast
  const [dbRecords, setDbRecords] = useState([]);   // records from DB
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [newCount, setNewCount] = useState(null);   // how many new shows were auto-added

  // Edit form
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        setUser(u);
        setChecking(false);
        if (u?.role === "admin" || pinAuthed) loadAll();
        else setLoading(false);
      })
      .catch(() => { setChecking(false); setLoading(false); });
  }, []);  // eslint-disable-line

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinLoading(true);
    setPinError("");
    try {
      const res = await base44.functions.invoke("verifyAdminPin", { pin });
      if (res.data?.success) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setPinAuthed(true);
        loadAll();
      } else {
        setPinError("PIN incorrecto. Inténtalo de nuevo.");
      }
    } catch {
      setPinError("Error al verificar el PIN.");
    }
    setPinLoading(false);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setSyncing(true);
    setNewCount(null);

    const [azuraRes, dbData] = await Promise.all([
      fetch(SCHEDULE_API).then(r => r.ok ? r.json() : []).catch(() => []),
      base44.entities.Schedule.list().catch(() => []),
    ]);

    // Deduplicate AzuraCast shows by name (keep first occurrence for times)
    const seen = new Set();
    const unique = [];
    for (const s of (azuraRes || [])) {
      const name = s.name?.trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      unique.push({ name, time_start: tsToTime(s.start_timestamp), time_end: tsToTime(s.end_timestamp) });
    }
    setAzuraShows(unique);

    // Auto-create DB records for new shows not yet in DB
    const dbNames = new Set((dbData || []).map(r => r.show_name?.toLowerCase().trim()));
    const toCreate = unique.filter(s => !dbNames.has(s.name.toLowerCase()));

    let updatedDb = dbData || [];
    if (toCreate.length > 0) {
      await Promise.all(toCreate.map(s =>
        base44.entities.Schedule.create({ show_name: s.name, time_start: s.time_start, time_end: s.time_end })
      ));
      updatedDb = await base44.entities.Schedule.list().catch(() => updatedDb);
      setNewCount(toCreate.length);
    }

    setDbRecords(updatedDb);
    setLoading(false);
    setSyncing(false);
  }, []);

  const getDbRecord = (showName) =>
    dbRecords.find(r => r.show_name?.toLowerCase().trim() === showName?.toLowerCase().trim());

  const handleEdit = (showName) => {
    const rec = getDbRecord(showName);
    if (!rec) return;
    setEditingId(rec.id);
    setEditForm({
      description: rec.description || "",
      image_url: rec.image_url || "",
      dj_name: rec.dj_name || "",
      genre: rec.genre || "",
    });
  };

  const handleCancel = () => { setEditingId(null); setEditForm(EMPTY_EDIT); };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    await base44.entities.Schedule.update(editingId, editForm);
    const updated = await base44.entities.Schedule.list().catch(() => dbRecords);
    setDbRecords(updated);
    setSaving(false);
    setEditingId(null);
    setEditForm(EMPTY_EDIT);
  };

  const handleExport = async () => {
    const schedules = await base44.entities.Schedule.list().catch(() => []);
    const backup = {
      exported_at: new Date().toISOString(),
      version: 1,
      data: { schedules }
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pachi-radio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const backup = JSON.parse(text);
    const schedules = backup?.data?.schedules || [];
    if (schedules.length === 0) { alert("No se encontraron datos en el archivo."); return; }
    if (!confirm(`Importar ${schedules.length} programas. Esto reemplazará los registros existentes con el mismo nombre.`)) return;
    // Upsert: update if exists, create if not
    const existing = await base44.entities.Schedule.list().catch(() => []);
    const existingByName = Object.fromEntries(existing.map(r => [r.show_name?.toLowerCase().trim(), r]));
    await Promise.all(schedules.map(s => {
      const key = s.show_name?.toLowerCase().trim();
      const { id, created_date, updated_date, created_by, ...fields } = s;
      if (existingByName[key]) return base44.entities.Schedule.update(existingByName[key].id, fields);
      return base44.entities.Schedule.create(fields);
    }));
    await loadAll();
    alert("Importación completada.");
    e.target.value = "";
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setEditForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  // --- Auth guards ---
  if (checking) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  );

  const isAdmin = user?.role === "admin" || pinAuthed;

  if (!isAdmin) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="glass-card rounded-2xl p-8 neon-border text-center">
          <div className="w-14 h-14 rounded-full bg-violet-600/15 border border-violet-600/30 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6 text-violet-400" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-1">Panel Admin</h2>
          <p className="text-zinc-500 text-sm mb-6">Ingresa el PIN de administrador</p>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <Input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError(""); }}
              placeholder="••••••••"
              className="bg-zinc-900 border-zinc-700 text-white text-center text-lg tracking-widest placeholder:text-zinc-600 focus:border-violet-600"
              autoFocus
            />
            {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
            <Button
              type="submit"
              disabled={pinLoading || !pin}
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white border-0"
            >
              {pinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
          <a href={createPageUrl("Home")} className="text-zinc-600 text-xs mt-5 inline-block hover:text-zinc-400 transition-colors">← Volver a la radio</a>
        </div>
      </div>
    </div>
  );

  // Merge: show azura shows in order, or fallback to DB only
  const displayShows = azuraShows.length > 0
    ? azuraShows
    : dbRecords.map(r => ({ name: r.show_name, time_start: r.time_start, time_end: r.time_end }));

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 sticky top-0 z-10 bg-black/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <a href={createPageUrl("Home")} className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-violet-500" />
          <h1 className="text-white font-semibold text-sm uppercase tracking-wider">Gestión de Programación</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExport}
            title="Exportar backup completo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-green-400 hover:border-green-600 text-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <label
            title="Importar desde backup"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-blue-400 hover:border-blue-600 text-xs transition-all cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importar</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>

          <button
            onClick={loadAll}
            disabled={syncing}
            title="Sincronizar con AzuraCast"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-violet-400 hover:border-violet-600 text-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Sync status */}
        {newCount !== null && newCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-600/10 border border-violet-600/30 text-violet-400 text-sm">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{newCount} programa{newCount > 1 ? "s nuevos" : " nuevo"} detectado{newCount > 1 ? "s" : ""} desde AzuraCast y agregado{newCount > 1 ? "s" : ""} automáticamente.</span>
          </div>
        )}
        {newCount === 0 && !loading && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-500 text-xs">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
            Sincronizado con AzuraCast · {displayShows.length} programa{displayShows.length !== 1 ? "s" : ""} detectado{displayShows.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-zinc-900/50 rounded-xl animate-pulse" />)}
          </div>
        ) : displayShows.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron programas en AzuraCast.</p>
            <button onClick={loadAll} className="text-violet-400 text-xs mt-2 hover:text-violet-300">Reintentar</button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayShows.map((show) => {
              const rec = getDbRecord(show.name);
              const isEditing = rec && editingId === rec.id;

              return (
                <div
                  key={show.name}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isEditing ? "border-violet-600/50 bg-zinc-950" : "border-zinc-800 bg-zinc-900/40"
                  }`}
                >
                  {/* Show header row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Image thumbnail */}
                    {rec?.image_url ? (
                      <img src={rec.image_url} alt={show.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-zinc-700" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Radio className="w-5 h-5 text-zinc-600" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight">{show.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-violet-400 text-xs">{show.time_start} – {show.time_end}</span>
                        {rec?.genre && <span className="text-zinc-600 text-xs">{rec.genre}</span>}
                        {rec?.dj_name && <span className="text-zinc-600 text-xs">· {rec.dj_name}</span>}
                      </div>
                      {rec?.description && !isEditing && (
                        <p className="text-zinc-500 text-xs mt-1 line-clamp-1">{rec.description}</p>
                      )}
                      {!rec?.description && !isEditing && (
                        <p className="text-zinc-700 text-xs mt-1 italic">Sin descripción</p>
                      )}
                    </div>

                    {/* Edit toggle */}
                    {!isEditing ? (
                      <button
                        onClick={() => handleEdit(show.name)}
                        className="flex-shrink-0 p-2 rounded-lg text-zinc-500 hover:text-violet-400 hover:bg-violet-600/10 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={handleCancel}
                        className="flex-shrink-0 p-2 rounded-lg text-zinc-500 hover:text-white transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="border-t border-zinc-800 px-4 py-4 space-y-3 bg-black/30">
                      {/* DJ + Género */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 block">Nombre DJ</label>
                          <Input
                            value={editForm.dj_name}
                            onChange={e => setEditForm(f => ({ ...f, dj_name: e.target.value }))}
                            placeholder="Pachi Gutierrez"
                            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 block">Género</label>
                          <Input
                            value={editForm.genre}
                            onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}
                            placeholder="House, Electrónica..."
                            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Descripción */}
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 block">Descripción</label>
                        <textarea
                          value={editForm.description}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Descripción breve del programa..."
                          rows={2}
                          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm px-3 py-2 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-violet-600"
                        />
                      </div>

                      {/* Imagen */}
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1.5 block">Imagen</label>
                        <div className="flex items-center gap-3">
                          {editForm.image_url && (
                            <img src={editForm.image_url} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-zinc-700 flex-shrink-0" />
                          )}
                          <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            uploading ? "border-zinc-700 text-zinc-500" : "border-zinc-700 text-zinc-400 hover:border-violet-600 hover:text-violet-400"
                          }`}>
                            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            {uploading ? "Subiendo..." : "Subir imagen"}
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                          </label>
                          {editForm.image_url && (
                            <button onClick={() => setEditForm(f => ({ ...f, image_url: "" }))} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">
                              Quitar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Botón guardar */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-violet-600 hover:bg-violet-700 text-white border-0 h-8 text-xs px-4"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                          {saving ? "Guardando..." : "Guardar"}
                        </Button>
                        <Button onClick={handleCancel} variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white h-8 text-xs px-4">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}