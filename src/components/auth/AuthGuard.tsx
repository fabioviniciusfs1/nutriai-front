"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { dismissMutationError, retrySession, useAuth, useMutationError, useSessionError } from "@/lib/auth";
import { Spinner } from "@/components/api/QueryStatus";

type AuthGuardProps = {
  children: React.ReactNode;
  /** Exige perfil preenchido; sem ele o usuário é levado para /perfil. */
  requireProfile?: boolean;
};

export function AuthGuard({ children, requireProfile = true }: AuthGuardProps) {
  const auth = useAuth();
  const sessionError = useSessionError();
  const mutationError = useMutationError();
  const router = useRouter();

  const redirectTo =
    auth === undefined ? null : !auth.user ? "/login" : requireProfile && !auth.profile ? "/perfil" : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (auth === undefined && sessionError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-4 text-center">
        <p className="text-sm text-neutral-600">{sessionError}</p>
        <button
          type="button"
          onClick={retrySession}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (auth === undefined || redirectTo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {children}
      {mutationError && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl bg-neutral-900 p-4 text-sm text-white shadow-lg"
        >
          <span className="flex-1">Não foi possível salvar: {mutationError}</span>
          <button type="button" aria-label="Fechar aviso" onClick={dismissMutationError} className="text-neutral-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
