"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getInitials, signOut, useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { label: "Início", href: "/" },
  { label: "Nutrientes", href: "/nutrientes" },
  { label: "Histórico", href: "/historico" },
  { label: "Chat com IA", href: "/chat" },
];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const name = useAuth()?.user?.name ?? "";

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <header className="flex flex-wrap items-center gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
        <span className="text-xl">🌱</span>
      </div>

      <nav className="order-last grid w-full grid-cols-4 gap-1 md:order-none md:flex md:w-auto md:flex-1 md:items-center md:gap-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-2 py-2 text-center text-xs font-medium transition-colors sm:text-sm md:px-4 ${
              pathname === item.href
                ? "bg-accent text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <Link
          href="/perfil"
          title="Meu perfil"
          className={`flex items-center gap-2 rounded-full p-1 pr-1 transition-colors hover:bg-neutral-100 sm:pr-3 ${
            pathname === "/perfil" ? "bg-neutral-100" : ""
          }`}
        >
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
          >
            {getInitials(name)}
          </span>
          <span className="hidden text-sm font-semibold sm:block">{name}</span>
          <span className="sr-only sm:hidden">Meu perfil</span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          title="Sair"
          aria-label="Sair"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
