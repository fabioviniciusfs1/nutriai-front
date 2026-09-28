"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { addWeightEntry, useAuth } from "@/lib/auth";
import { WeightDialog } from "@/components/history/WeightDialog";

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Aviso no dia da pesagem escolhido no perfil; some quando há um peso registrado hoje. */
export function WeighInReminder() {
  const auth = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const today = new Date();
  const weights = auth?.weights ?? [];
  const lastEntry = weights.at(-1);
  const weighedToday = weights.some((entry) => isSameDay(new Date(entry.at), today));

  // Perfis salvos antes do campo existir não têm `weighInDay`.
  if (auth?.profile?.weighInDay !== today.getDay() || weighedToday) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Scale size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-neutral-900">Hoje é dia de pesagem</h3>
        <p className="text-sm text-neutral-500">Registre seu peso para acompanhar sua evolução no histórico.</p>
      </div>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
      >
        Registrar peso
      </button>

      <WeightDialog
        open={dialogOpen}
        lastKg={lastEntry?.kg}
        onConfirm={(kg, at) => {
          addWeightEntry(kg, at);
          setDialogOpen(false);
        }}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
