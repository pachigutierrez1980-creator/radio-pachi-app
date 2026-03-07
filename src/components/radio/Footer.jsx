import React from "react";

export default function Footer() {
  return (
    <footer className="relative z-10 py-8 mt-12 border-t border-zinc-900">
      <div className="text-center">
        <p className="text-zinc-700 text-xs">
          © {new Date().getFullYear()} Pachi Gutierrez Radio. Todos los derechos reservados.
        </p>
        <p className="text-zinc-800 text-[10px] mt-1">
          Desarrollado con AzuraCast
        </p>
      </div>
    </footer>
  );
}