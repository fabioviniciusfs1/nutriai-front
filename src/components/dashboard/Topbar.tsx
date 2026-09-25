"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { getInitials, signOut, useAuth } from "@/lib/auth";

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Início", href: "/" },
  { label: "Nutrientes", href: "/nutrientes" },
  { label: "Alimentos", href: "/alimentos" },
  { label: "Histórico", href: "/historico" },
  { label: "Chat com IA", href: "/chat" },
];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const name = useAuth()?.user?.name ?? "";
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  // No desktop, a grade 1fr/auto/1fr põe as páginas no centro exato da barra,
  // não só no espaço entre o nome e o perfil.
  return (
    <header className="relative z-30 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4">
      {/* No celular as páginas ficam num menu que abre à esquerda do nome. */}
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
        aria-controls="topbar-menu"
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 md:hidden"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <Link href="/" className="text-lg font-bold text-accent md:justify-self-start">
        NutriAI
      </Link>

      <nav className="hidden md:flex md:items-center md:justify-center md:gap-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-accent text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {menuOpen && (
        <>
          <div
            aria-hidden
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 md:hidden"
          />
          <nav
            id="topbar-menu"
            className="absolute left-0 right-0 top-full z-50 mt-2 flex flex-col gap-1 rounded-2xl bg-white p-2 shadow-lg md:hidden"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-accent text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}

      <div className="ml-auto flex items-center gap-1 md:ml-0 md:justify-self-end">
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
