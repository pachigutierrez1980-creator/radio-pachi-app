import React, { useState, useEffect } from "react";
import { CalendarDays, ChevronRight, Zap, Radio, Music } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATION = "pachi_gutierrez_dj";
const BASE_URL = "https://a6.asurahosting.com";
const SCHEDULE_API = `${BASE_URL}/api/station/${STATION}/schedule`;

function useCountdown(targetTimestamp) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!targetTimestamp) return;
    const tick = () => setRemaining(Math.max(0, targetTimestamp * 1000 - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp]);
  const totalSecs = Math.floor(remaining / 1000);
  return {
    h: Math.floor(totalSecs / 3600),
    m: Math.floor((totalSecs % 3600) / 60),
    s: totalSecs % 60,
    done: remaining === 0,
  };
}

function pad(n) { return String(n).padStart(2, "0"); }

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ShowCard({ show, isCurrent, isPast, dbRecord }) {
  const description = dbRecord?.description || null;
  const imageUrl = dbRecord?.image_url || null;

  return (
    <div
      className={`rounded-xl border p-3 transition-all duration-300 ${
        isCurrent
          ? "bg-violet-600/15 border-violet-600/50 shadow-[0_0_20px_rgba(124,58,237,0.2)]"
          : isPast
          ? "bg-zinc-900/20 border-zinc-800/30 opacity-45"
          : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/60"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Imagen o icono */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={show.name}
            className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover transition-all duration-300 hover:scale-105 ${
              isCurrent
                ? "border-2 border-violet-500 shadow-[0_0_12px_rgba(124,58,237,0.5)]"
                : "border border-zinc-700/50 shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.6)]"
            }`}
          />
        ) : (
          <div className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isCurrent ? "bg-violet-600/30 border-2 border-violet-500/50 shadow-[0_0_12px_rgba(124,58,237,0.3)]" : "bg-zinc-800 border border-zinc-700/50"
          }`}>
            {isCurrent ? (
              <Radio className="w-7 h-7 text-violet-400" />
            ) : (
              <Music className="w-7 h-7 text-zinc-600" />
            )}
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm leading-tight ${isCurrent ? "text-white" : "text-zinc-300"}`}>
              {show.name}
            </span>
            {isCurrent && (
              <span className="text-[9px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">
                EN VIVO
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${isCurrent ? "text-violet-400" : "text-zinc-500"}`}>
            {formatTime(show.start_timestamp)} – {formatTime(show.end_timestamp)}
          </p>
          {description ? (
            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">{description}</p>
          ) : (
            <p className="text-zinc-600 text-xs mt-1 italic">Sin descripción</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FreeSlot({ hour }) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-transparent px-3 py-2.5 flex items-center gap-3">
      <span className="text-zinc-700 font-mono text-xs w-10 flex-shrink-0">{pad(hour)}:00</span>
      <span className="text-zinc-700 text-xs italic">Libre — Espacio disponible en la programación.</span>
    </div>
  );
}

export default function ScheduleSection() {
  const [schedule, setSchedule] = useState([]);
  const [dbSchedule, setDbSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchAll = async () => {
    try {
      const [apiRes, dbRes] = await Promise.all([
        fetch(SCHEDULE_API),
        base44.entities.Schedule.list(),
      ]);
      if (apiRes.ok) setSchedule(await apiRes.json());
      setDbSchedule(dbRes || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getDbRecord = (showName) => {
    return dbSchedule.find(
      (r) => r.show_name?.toLowerCase().trim() === showName?.toLowerCase().trim()
    ) || null;
  };

  const nowSec = Math.floor(now / 1000);

  const current = schedule.find((s) => s.start_timestamp <= nowSec && s.end_timestamp > nowSec);
  const upcoming = schedule
    .filter((s) => s.start_timestamp > nowSec)
    .sort((a, b) => a.start_timestamp - b.start_timestamp)[0];

  const countdown = useCountdown(upcoming?.start_timestamp);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = new Date(now).getHours();

  const getShowForHour = (hour) => {
    const base = new Date(now);
    base.setHours(hour, 0, 0, 0);
    const slotStartSec = Math.floor(base.getTime() / 1000);
    base.setHours(hour + 1, 0, 0, 0);
    const slotEndSec = Math.floor(base.getTime() / 1000);
    return schedule.find((s) => s.start_timestamp < slotEndSec && s.end_timestamp > slotStartSec);
  };

  return (
    <div id="schedule" className="glass-card rounded-2xl neon-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-violet-500" />
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
          Programación de Hoy
        </h3>
        <span className="ml-auto text-zinc-600 text-xs">
          {new Date(now).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      {/* Current + Next + Countdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800/30">
        {/* EN ESTE MOMENTO */}
        <div className="bg-black/40 p-4">
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block pulse-on-air" />
            En este momento
          </p>
          {loading ? (
            <div className="h-8 bg-zinc-800/50 rounded animate-pulse" />
          ) : current ? (
            <>
              <p className="text-white font-bold text-base leading-tight">{current.name}</p>
              <p className="text-violet-400 text-xs mt-1">
                {formatTime(current.start_timestamp)} – {formatTime(current.end_timestamp)}
              </p>
            </>
          ) : (
            <p className="text-zinc-500 text-sm italic">Libre</p>
          )}
        </div>

        {/* PRÓXIMO */}
        <div className="bg-black/40 p-4">
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3" />
            Próximo programa
          </p>
          {loading ? (
            <div className="h-8 bg-zinc-800/50 rounded animate-pulse" />
          ) : upcoming ? (
            <>
              <p className="text-white font-bold text-base leading-tight">{upcoming.name}</p>
              <p className="text-blue-400 text-xs mt-1">
                {formatTime(upcoming.start_timestamp)} – {formatTime(upcoming.end_timestamp)}
              </p>
            </>
          ) : (
            <p className="text-zinc-500 text-sm italic">Sin programación</p>
          )}
        </div>

        {/* CUENTA REGRESIVA */}
        <div className="bg-black/40 p-4">
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            Empieza en
          </p>
          {upcoming && !countdown.done ? (
            <div className="flex items-end gap-1.5">
              {[{ v: countdown.h, label: "hrs" }, { v: countdown.m, label: "min" }, { v: countdown.s, label: "seg", color: "text-violet-400" }].map(({ v, label, color }, i, arr) => (
                <React.Fragment key={label}>
                  <div className="text-center">
                    <span className={`${color || "text-white"} font-black text-2xl leading-none tabular-nums`}>{pad(v)}</span>
                    <p className="text-zinc-600 text-[9px] uppercase">{label}</p>
                  </div>
                  {i < arr.length - 1 && <span className="text-zinc-600 font-bold text-xl mb-1">:</span>}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm italic">—</p>
          )}
        </div>
      </div>

      {/* 24h Grid - Tarjetas */}
      <div className="p-4">
        <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-3">Grilla de 24 horas</p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-zinc-800/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
            {hours.map((hour) => {
              const show = getShowForHour(hour);
              const isCurrent = hour === currentHour;
              const isPast = hour < currentHour;

              if (!show) {
                return isPast ? null : <FreeSlot key={hour} hour={hour} />;
              }

              return (
                <div key={hour} className="flex gap-2 items-start">
                  <span className={`font-mono text-xs w-10 flex-shrink-0 mt-3.5 ${isCurrent ? "text-violet-400 font-bold" : "text-zinc-600"}`}>
                    {pad(hour)}:00
                  </span>
                  <div className="flex-1">
                    <ShowCard
                      show={show}
                      isCurrent={isCurrent}
                      isPast={isPast}
                      dbRecord={getDbRecord(show.name)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}