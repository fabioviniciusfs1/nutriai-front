"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeGoogleSignIn } from "@/lib/auth";
import { Spinner } from "@/components/api/QueryStatus";

/** Volta do login com Google: troca o código pelo token e segue para o app. */
export function GoogleCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // O código do backend é de uso único: não pode ser trocado duas vezes (o StrictMode roda o efeito de novo).
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    completeGoogleSignIn(params).then((result) => {
      // `replace` tira o código do histórico. Sem perfil, o AuthGuard de "/" leva para /perfil.
      if (result.ok) router.replace("/");
      else setError(result.error);
    });
  }, [router]);

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
      {error ? (
        <>
          <h1 className="font-semibold text-neutral-900">Não foi possível entrar com o Google</h1>
          <p role="alert" className="mt-2 text-sm text-neutral-600">
            {error}
          </p>
          <Link
            href="/login"
            replace
            className="mt-5 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Voltar para o login
          </Link>
        </>
      ) : (
        <>
          <Spinner />
          <p className="mt-3 text-sm text-neutral-500">Entrando com o Google…</p>
        </>
      )}
    </div>
  );
}
