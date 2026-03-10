import React, { useState, useEffect } from "react";
import { Radio, CalendarDays, User, Settings } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const NAV_ITEMS = [
  { label: "Radio", icon: Radio, href: "#player" },
  { label: "Programación", icon: CalendarDays, href: "#schedule" },
  { label: "DJ", icon: User, href: "#profile" },
];

export default function Layout({ children, currentPageName }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then((u) => { if (u?.role === "admin") setIsAdmin(true); })
      .catch(() => {});
  }, []);

  const handleNav = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Botón admin flotante — solo admins, solo en Home */}
      {isAdmin && currentPageName === "Home" && (
        <a
          href={createPageUrl("Admin")}
          title="Panel de administrador"
          className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-violet-400 hover:border-violet-600 transition-all shadow-lg"
        >
          <Settings className="w-4 h-4" />
        </a>
      )}

      {children}

      {/* Bottom navigation — solo móvil, solo en Home */}
      {currentPageName === "Home" && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-zinc-800">
          <div className="flex items-center justify-around px-4 py-3">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                onClick={(e) => handleNav(e, href)}
                className="flex flex-col items-center gap-1 text-zinc-500 hover:text-violet-400 active:text-violet-300 transition-colors min-w-[60px]"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] uppercase tracking-wider">{label}</span>
              </a>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}