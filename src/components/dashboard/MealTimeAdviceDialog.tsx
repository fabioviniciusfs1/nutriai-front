"use client";

import { useEffect, useRef } from "react";

type MealTimeAdviceDialogProps = {
  open: boolean;
  title: string;
  /** Por que o horário escolhido não é bom (do assistente ou da regra da rotina). */
  message: string;
  /** "HH:MM" escolhido pelo usuário. */
  time: string;
  /** "HH:MM" sugerido no lugar; `null` = sem sugestão. */
  suggestedTime: string | null;
  /** `false` quando a rotina não deixa comer no horário escolhido: sem "Manter". */
  canKeep: boolean;
  busy: boolean;
  onChoose: (time: string) => void;
  onCancel: () => void;
};

/** Aviso sobre o novo horário: manter o escolhido (quando a rotina deixa) ou mudar para o sugerido. */
export function MealTimeAdviceDialog({
  open,
  title,
  message,
  time,
  suggestedTime,
  canKeep,
  busy,
  onChoose,
  onCancel,
}: MealTimeAdviceDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="p-5">
        <h4 className="font-semibold text-neutral-900">{title}</h4>
        <p className="mt-2 text-sm text-neutral-600">{message}</p>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-60"
          >
            Cancelar
          </button>
          {canKeep && (
            <button
              type="button"
              onClick={() => onChoose(time)}
              disabled={busy}
              className={
                suggestedTime
                  ? "rounded-full bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25 disabled:opacity-60"
                  : "rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
              }
            >
              Manter {time}
            </button>
          )}
          {suggestedTime && (
            <button
              type="button"
              autoFocus
              onClick={() => onChoose(suggestedTime)}
              disabled={busy}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
            >
              Mudar para {suggestedTime}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
