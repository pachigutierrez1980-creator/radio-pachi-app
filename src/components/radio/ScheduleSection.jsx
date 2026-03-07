import React from "react";
import { Clock, CalendarDays, Music } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_ES = {
  Monday: "Lun",
  Tuesday: "Mar",
  Wednesday: "Mié",
  Thursday: "Jue",
  Friday: "Vie",
  Saturday: "Sáb",
  Sunday: "Dom",
};

const DEFAULT_SCHEDULE = [
  { day: "Monday", time_start: "20:00", time_end: "23:00", show_name: "Sesiones Deep House", dj_name: "Pachi Gutierrez", genre: "Deep House" },
  { day: "Wednesday", time_start: "21:00", time_end: "00:00", show_name: "Techno Underground", dj_name: "Pachi Gutierrez", genre: "Techno" },
  { day: "Friday", time_start: "22:00", time_end: "02:00", show_name: "Mix del Viernes", dj_name: "Pachi Gutierrez", genre: "EDM / Dance" },
  { day: "Saturday", time_start: "23:00", time_end: "03:00", show_name: "Rave de Fin de Semana", dj_name: "Pachi Gutierrez", genre: "Progressive House" },
];

export default function ScheduleSection() {
  const { data: scheduleData = [] } = useQuery({
    queryKey: ["schedule"],
    queryFn: () => base44.entities.Schedule.list(),
    initialData: [],
  });

  const schedule = scheduleData.length > 0 ? scheduleData : DEFAULT_SCHEDULE;

  const sorted = [...schedule].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );

  return (
    <div className="glass-card rounded-2xl neon-border overflow-hidden">
      <div className="p-4 border-b border-zinc-800/50 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-violet-500" />
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Programación</h3>
      </div>

      <div className="p-4 space-y-3">
        {sorted.map((item, i) => (
          <div
            key={i}
            className="group flex items-center gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:border-violet-600/30 hover:bg-violet-600/5 transition-all duration-300"
          >
            <div className="w-14 text-center flex-shrink-0">
              <span className="text-violet-400 font-bold text-xs uppercase">
                {DAY_ES[item.day] || item.day?.slice(0, 3)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white text-sm font-medium truncate">{item.show_name}</h4>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-zinc-500 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.time_start} - {item.time_end}
                </span>
                {item.genre && (
                  <span className="text-zinc-600 text-xs flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    {item.genre}
                  </span>
                )}
              </div>
            </div>
            {item.is_live && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-violet-600 rounded-full pulse-on-air" />
                <span className="text-violet-400 text-[10px] font-bold uppercase">En Vivo</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}