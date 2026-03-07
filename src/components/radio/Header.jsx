import React from "react";

export default function Header() {
  return (
    <header className="relative z-10 py-6 md:py-10 flex flex-col items-center text-center">
      {/* Logo image */}
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69aaf8c2c8f263a964c1aebf/5374fd439_trans.png"
        alt="Pachi Gutierrez"
        className="h-16 md:h-24 w-auto mb-3 drop-shadow-[0_0_18px_rgba(124,58,237,0.5)]" />


      {/* RADIO */}
      


      {/* RADIO */}
      <p className="text-white text-2xl md:text-3xl font-black uppercase tracking-[0.3em] mt-2">
        RADIO
      </p>

      {/* DJ MOTION GRAPHICS */}
      <p className="text-blue-400 text-xs md:text-sm font-bold uppercase tracking-[0.4em] mt-1">
        DJ MOTION GRAPHICS
      </p>
    </header>);

}