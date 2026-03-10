import React from "react";

const SOCIALS = [
  {
    name: "TikTok",
    url: "https://tiktok.com/@pachigutierrez",
    color: "hover:text-pink-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.95a8.27 8.27 0 004.84 1.54V7.05a4.85 4.85 0 01-1.07-.36z"/>
      </svg>
    ),
  },
  {
    name: "YouTube",
    url: "https://youtube.com/@pachigutierrez",
    color: "hover:text-red-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z"/>
      </svg>
    ),
  },
  {
    name: "Facebook",
    url: "https://facebook.com/pachigutierrez",
    color: "hover:text-blue-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/>
      </svg>
    ),
  },
  {
    name: "Twitch",
    url: "https://twitch.tv/pachigutierrez",
    color: "hover:text-violet-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M11.64 5.93h1.43v4.28h-1.43zm3.93 0H17v4.28h-1.43zM7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2zm11.57 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h10.86z"/>
      </svg>
    ),
  },
  {
    name: "Instagram",
    url: "https://instagram.com/pachigutierrez",
    color: "hover:text-pink-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    name: "Sitio Web",
    url: "https://pachigutierrez.live",
    color: "hover:text-emerald-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    ),
  },
];

export default function DJProfile() {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 neon-border text-center">
      {/* Foto de perfil */}
      <div className="relative inline-block mb-5">
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-violet-600/50 shadow-[0_0_25px_rgba(124,58,237,0.3)] mx-auto">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69aaf8c2c8f263a964c1aebf/0df22ee9b_3.jpg"
            alt="Pachi Gutierrez DJ"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
          DJ
        </div>
      </div>

      {/* Nombre */}
      <h2 className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight">
        PACHI GUTIERREZ
      </h2>
      <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-4">
        DJ / Motion Producer
      </p>

      {/* Bio */}
      <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto mb-6">
        Fusionando música, tecnología y creatividad para crear experiencias sonoras y visuales.
      </p>

      {/* Redes sociales */}
      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Redes Sociales</p>
      <div className="flex items-center justify-center gap-4">
        {SOCIALS.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            title={social.name}
            className={`text-zinc-500 transition-all duration-300 ${social.color} hover:scale-110`}
          >
            {social.icon}
          </a>
        ))}
      </div>
    </div>
  );
}