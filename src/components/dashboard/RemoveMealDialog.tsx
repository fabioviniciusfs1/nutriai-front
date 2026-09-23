"use client";

import { useEffect, useRef, useState } from "react";

export type RemoveMealOption = "suggest" | "redistribute" | "nothing";

type RemoveMealDialogProps = {
  open: boolean;
  mealTitle: string;
  mealKcal: number;
  /** Refeições seguintes e como ficam as calorias delas se a opção "redistribuir" for escolhida. */
  redistribution: { title: string; time: string; before: number; after: number }[];
  canSuggest: boolean;
  onConfirm: (option: RemoveMealOption) => void;
  onCancel: () => void;
};

export function RemoveMealDialog({
  open,
  mealTitle,
  mealKcal,
  redistribution,
  canSuggest,
  onConfirm,
  onCancel,
}: RemoveMealDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [option, setOption] = useState<RemoveMealOption | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setOption(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const nextMealsCount = redistribution.length;
  const options: { id: RemoveMealOption; label: string; description: string; disabled?: boolean }[] = [
    {
      id: "suggest",
      label: "Sim, sugerir uma nova",
      description: canSuggest
        ? "Troca por outra refeição com calorias parecidas, no mesmo horário."
        : "Não há outras sugestões disponíveis no momento.",
      disabled: !canSuggest,
    },
    {
      id: "redistribute",
      label: "Sim, redistribuir os nutrientes na(s) próxima(s) refeição(ões)",
      description:
        nextMealsCount === 0
          ? "Não há refeições depois desta no dia."
          : `Os ${mealKcal} kcal desta refeição vão para ${
              nextMealsCount === 1 ? "a próxima refeição" : `as ${nextMealsCount} próximas refeições`
            }, que terão as porções aumentadas:`,
      disabled: nextMealsCount === 0,
    },
    {
      id: "nothing",
      label: "Sim, não fazer nada",
      description: "A refeição sai do plano e os nutrientes dela não são repostos.",
    },
  ];

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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <form
        className="p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (option) onConfirm(option);
        }}
      >
        <h4 className="font-semibold text-neutral-900">Remover refeição?</h4>
        <p className="mt-1 text-sm text-neutral-600">&ldquo;{mealTitle}&rdquo; será removida do plano de hoje.</p>

        <fieldset className="mt-4 flex min-w-0 flex-col gap-2">
          <legend className="sr-only">O que fazer ao remover</legend>
          {options.map((item) => (
            <label
              key={item.id}
              className={`flex gap-3 rounded-xl border p-3 transition-colors ${
                item.disabled
                  ? "cursor-not-allowed border-neutral-100 opacity-50"
                  : option === item.id
                    ? "cursor-pointer border-accent bg-accent/5"
                    : "cursor-pointer border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name="remove-meal-option"
                value={item.id}
                checked={option === item.id}
                disabled={item.disabled}
                onChange={() => setOption(item.id)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-neutral-900">{item.label}</span>
                <span className="mt-0.5 block text-xs text-neutral-500">{item.description}</span>
                {item.id === "redistribute" && nextMealsCount > 0 && (
                  <span className="mt-2 flex flex-col gap-1">
                    {redistribution.map((meal) => (
                      <span key={`${meal.time}-${meal.title}`} className="flex items-center gap-2 text-xs">
                        <span className="w-9 shrink-0 text-neutral-400">{meal.time}</span>
                        <span className="min-w-0 flex-1 truncate text-neutral-700">{meal.title}</span>
                        <span className="shrink-0 tabular-nums text-neutral-500">
                          {meal.before} → <span className="font-medium text-neutral-900">{meal.after}</span> kcal
                        </span>
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={option === null}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </form>
    </dialog>
  );
}
