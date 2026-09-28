"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeGoogleConnect } from "@/lib/auth";
import { Spinner } from "@/components/api/QueryStatus";

/** Volta da conexão com o Google: confere o resultado e retorna ao perfil. */
export function GoogleConnectCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // O `state` só vale uma vez (o StrictMode roda o efeito de novo).
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const result = completeGoogleConnect(new URLSearchParams(window.location.search));
    if (result.ok) router.replace("/perfil");
    // Adiado para fora do corpo do efeito, como uma resposta assíncrona.
    else queueMicrotask(() => setError(result.error));
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
      {error ? (
        <>
          <h1 className="font-semibold text-neutral-900">Não foi possível conectar o Google</h1>
          <p role="alert" className="mt-2 text-sm text-neutral-600">
            {error}
          </p>
          <Link
            href="/perfil"
            replace
            className="mt-5 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Voltar para o perfil
          </Link>
        </>
      ) : (
        <>
          <Spinner />
          <p className="mt-3 text-sm text-neutral-500">Conectando o Google…</p>
        </>
      )}
    </div>
  );
}
