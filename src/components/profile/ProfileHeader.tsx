"use client";

import { useAuth } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/Topbar";

// No primeiro acesso (sem perfil) a navbar não aparece: as outras páginas exigem o perfil preenchido.
export function ProfileHeader() {
  const auth = useAuth();
  const firstName = auth?.user?.name.split(" ")[0];

  if (auth?.profile) {
    return (
      <>
        <Topbar />
        <h2 className="text-lg font-semibold text-neutral-900">Meu perfil</h2>
      </>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-neutral-500">Boas-vindas, {firstName}! 🌱</p>
      <h2 className="mt-1 text-xl font-semibold text-neutral-900">Vamos montar seu perfil</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Com esses dados estimamos quantas calorias seu plano alimentar deve ter.
      </p>
    </div>
  );
}
