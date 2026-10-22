"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { getInitials, signOut, useAuth } from "@/lib/auth";
import { CHAT_ENABLED } from "@/lib/features";

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Início", href: "/" },
  { label: "Nutrientes", href: "/nutrientes" },
  { label: "Alimentos", href: "/alimentos" },
  { label: "Histórico", href: "/historico" },
  ...(CHAT_ENABLED ? [{ label: "Chat com IA", href: "/chat" }] : []),
];

/** Páginas do card que abre ao clicar no nome. */
const USER_ITEMS: { label: string; href: string }[] = [
  { label: "Perfil", href: "/perfil" },
  { label: "Rotina", href: "/rotina" },
  { label: "Conexão Google Health", href: "/google-health" },
];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const name = useAuth()?.user?.name ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const onUserPage = USER_ITEMS.some((item) => item.href === pathname);

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
        onClick={() => {
          setUserMenuOpen(false);
          setMenuOpen((open) => !open);
        }}
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
                : "bg-accent/15 text-accent hover:bg-accent/25"
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
                    : "bg-accent/15 text-accent hover:bg-accent/25"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}

      <div className="ml-auto flex items-center gap-1 md:ml-0 md:justify-self-end">
        <button
          type="button"
          onClick={() => setUserMenuOpen((open) => !open)}
          title="Minha conta"
          aria-expanded={userMenuOpen}
          aria-controls="topbar-user-menu"
          className={`flex items-center gap-2 rounded-full p-1 pr-1 transition-colors hover:bg-neutral-100 sm:pr-3 ${
            onUserPage || userMenuOpen ? "bg-neutral-100" : ""
          }`}
        >
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
          >
            {getInitials(name)}
          </span>
          <span className="hidden text-sm font-semibold sm:block">{name}</span>
          <span className="sr-only sm:hidden">Minha conta</span>
        </button>
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

      {userMenuOpen && (
        <>
          <div aria-hidden onClick={() => setUserMenuOpen(false)} className="fixed inset-0 z-40" />
          <nav
            id="topbar-user-menu"
            aria-label="Minha conta"
            className="absolute right-0 top-full z-50 mt-2 flex w-64 max-w-full flex-col gap-1 rounded-2xl bg-white p-2 shadow-lg"
          >
            {USER_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setUserMenuOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === item.href ? "bg-accent text-white" : "bg-accent/15 text-accent hover:bg-accent/25"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
