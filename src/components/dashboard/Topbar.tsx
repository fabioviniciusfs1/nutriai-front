"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Início", href: "/" },
  { label: "Chat com IA", href: "/chat" },
];

export function Topbar() {
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
        <span className="text-xl">🌱</span>
      </div>

      <nav className="flex flex-1 flex-wrap items-center gap-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-accent text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Image
          src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=80&h=80&q=70"
          alt="Foto de perfil de Masud A."
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
        <p className="hidden text-sm font-semibold sm:block">Masud A.</p>
      </div>
    </header>
  );
}
