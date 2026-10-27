"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Scale } from "lucide-react";
import { useApiQuery } from "@/lib/api/query";
import { addWeightEntry, WEIGHTS_PATH } from "@/lib/api/actions";
import type { WeightEntry } from "@/lib/api/types";
import { useNotifications, type AppNotification } from "@/lib/notifications";
import { WeightDialog } from "@/components/history/WeightDialog";

/** As notificações de agora; cada uma sai quando é resolvida. */
export function NotificationList() {
  const notifications = useNotifications();

  if (notifications.length === 0)
    return <p className="rounded-2xl bg-white p-5 text-sm text-neutral-400 shadow-sm">Nenhuma notificação.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {notifications.map((notification) => (
        <li key={notification.id}>
          <NotificationCard notification={notification} />
        </li>
      ))}
    </ul>
  );
}

function NotificationCard({ notification }: { notification: AppNotification }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        {notification.kind === "calories" ? <Flame size={20} /> : <Scale size={20} />}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-neutral-900">{notification.title}</h3>
        <p className="text-sm text-neutral-500">{notification.text}</p>
      </div>
      {notification.kind === "weigh-in" && <WeighInAction />}
      {notification.kind === "calories" && (
        <Link
          href="/ajuste-dieta"
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          Ajustar calorias
        </Link>
      )}
    </div>
  );
}

/** "Registrar peso": salvar invalida o /me, e a notificação sai sozinha (`weighInDue`). */
function WeighInAction() {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Só para sugerir o último peso no campo.
  const lastEntry = useApiQuery<WeightEntry[]>(WEIGHTS_PATH).data?.at(-1);

  return (
    <>
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
    </>
  );
}
