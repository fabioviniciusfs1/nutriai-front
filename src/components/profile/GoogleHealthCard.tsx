"use client";

import { useEffect, useState } from "react";
import { HeartPulse } from "lucide-react";
import { connectGoogle, disconnectGoogle, useAuth } from "@/lib/auth";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";

/** Conexão com o Google, que dá acesso aos dados da Google Health API (atividade, calorias gastas…). */
export function GoogleHealthCard() {
  const google = useAuth()?.google ?? null;
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  // Voltar do Google pelo botão "voltar" pode restaurar a página do cache com o botão travado.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function connect() {
    setError(null);
    setRedirecting(true);
    const result = await connectGoogle();
    if (!result.ok) {
      setError(result.error);
      setRedirecting(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      {/* No celular, o botão fica embaixo do texto, na largura toda; a partir do sm, ao lado. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <HeartPulse size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-neutral-900">Google Health</h3>
            <p className="break-words text-sm text-neutral-500">
              {google
                ? `Conectado como ${google.email}. Sua atividade e as calorias gastas vêm do Google Health.`
                : "Conecte sua conta Google para importar atividade física e calorias gastas."}
            </p>
          </div>
        </div>

        {google ? (
          google.canDisconnect && (
            <button
              type="button"
              onClick={() => setConfirmingDisconnect(true)}
              className="w-full shrink-0 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:w-auto"
            >
              Desconectar
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={redirecting}
            className="flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60 sm:w-auto"
          >
            <GoogleIcon size={16} />
            {redirecting ? "Abrindo o Google…" : "Conectar com o Google"}
          </button>
        )}
      </div>

      {google && !google.canDisconnect && (
        <p className="mt-3 text-xs text-neutral-500">
          Sua conta foi criada com o Google, que é o seu jeito de entrar: não dá para desconectar.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmingDisconnect}
        title="Desconectar o Google?"
        description="O NutriAI para de importar seus dados do Google Health. Os dados já importados continuam no histórico."
        confirmLabel="Desconectar"
        onConfirm={() => {
          setConfirmingDisconnect(false);
          void disconnectGoogle();
        }}
        onCancel={() => setConfirmingDisconnect(false)}
      />
    </section>
  );
}
