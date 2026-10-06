"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useApiQuery } from "@/lib/api/query";
import { addWeightEntry, WEIGHTS_PATH } from "@/lib/api/actions";
import type { WeightEntry } from "@/lib/api/types";
import { WeightDialog } from "@/components/history/WeightDialog";

/** Aviso no dia da pesagem escolhido no perfil; o backend diz quando mostrar (`weighInDue`). */
export function WeighInReminder() {
  const due = useAuth()?.weighInDue ?? false;
  if (!due) return null;
  return <WeighInCard />;
}

function WeighInCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Só para sugerir o último peso no campo.
  const lastEntry = useApiQuery<WeightEntry[]>(WEIGHTS_PATH).data?.at(-1);

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
        onConfirm={async (kg, at) => {
          if (await addWeightEntry(kg, at)) setDialogOpen(false);
        }}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
