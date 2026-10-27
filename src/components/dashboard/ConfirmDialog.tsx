"use client";

import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destaca o botão de cancelar (fundo laranja, à direita) em vez do de confirmar. */
  highlightCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  highlightCancel = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const primary = "rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90";
  const secondary = "rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100";

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
        <p className="mt-2 text-sm text-neutral-600">{description}</p>

        {/* O botão em destaque fica sempre à direita. */}
        <div className={`mt-5 flex gap-2 ${highlightCancel ? "flex-row-reverse justify-start" : "justify-end"}`}>
          <button
            type="button"
            onClick={onCancel}
            className={highlightCancel ? primary : secondary}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={highlightCancel ? secondary : primary}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
