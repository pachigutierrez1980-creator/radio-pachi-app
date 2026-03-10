import React from "react";
import { Radio, CalendarDays, User } from "lucide-react";

const NAV_ITEMS = [
  { label: "Radio", icon: Radio, href: "#player" },
  { label: "Programación", icon: CalendarDays, href: "#schedule" },
  { label: "DJ", icon: User, href: "#profile" },
];

export default function Layout({ children }) {
  const handleNav = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      {children}

      {/* Bottom navigation — solo móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-zinc-800">
        <div className="flex items-center justify-around px-4 py-3">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
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
    </div>
  );
}