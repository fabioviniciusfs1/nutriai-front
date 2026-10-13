"use client";

import { useAuth } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/Topbar";

const STEPS = {
  1: {
    heading: "Vamos montar seu perfil",
    text: "Com esses dados estimamos quantas calorias seu plano alimentar deve ter.",
  },
  2: {
    heading: "Agora, sua rotina",
    text: "Com ela, o assistente monta um plano alimentar que cabe no seu dia.",
  },
} as const;

/**
 * Cabeçalho das páginas de perfil (passo 1) e de rotina (passo 2). No cadastro (ainda sem rotina) a navbar não
 * aparece: as outras páginas exigem perfil e rotina preenchidos.
 */
export function ProfileHeader({ title, step }: { title: string; step: 1 | 2 }) {
  const auth = useAuth();
  const firstName = auth?.user?.name.split(" ")[0];

  if (auth?.routine) {
    return (
      <>
        <Topbar />
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      </>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-neutral-500">
        {step === 1 ? `Boas-vindas, ${firstName}! 🌱` : "Quase lá!"} · Passo {step} de 2
      </p>
      <h2 className="mt-1 text-xl font-semibold text-neutral-900">{STEPS[step].heading}</h2>
      <p className="mt-1 text-sm text-neutral-500">{STEPS[step].text}</p>
    </div>
  );
}
