"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

type AuthGuardProps = {
  children: React.ReactNode;
  /** Exige perfil preenchido; sem ele o usuário é levado para /perfil. */
  requireProfile?: boolean;
};

export function AuthGuard({ children, requireProfile = true }: AuthGuardProps) {
  const auth = useAuth();
  const router = useRouter();

  const redirectTo =
    auth === undefined ? null : !auth.user ? "/login" : requireProfile && !auth.profile ? "/perfil" : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (auth === undefined || redirectTo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
        <span className="sr-only">Carregando…</span>
      </div>
    );
  }

  return children;
}
