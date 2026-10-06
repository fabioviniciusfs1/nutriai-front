"use client";

import { useEffect, useRef, useState } from "react";
import { FOOD_FEEDBACK, type FoodFeedback } from "@/lib/food-feedback";
import { useApiQuery } from "@/lib/api/query";
import type { PlanFood } from "@/lib/api/types";
import { Spinner } from "@/components/api/QueryStatus";

type FoodFeedbackDialogProps = {
  /** Refeição onde o botão foi clicado ("Não quero" troca só nela); `null` = diálogo fechado. */
  mealId: number | null;
  foodName: string;
  mealTitle: string;
  onConfirm: (reason: FoodFeedback, substitute: string | null) => Promise<void>;
  onCancel: () => void;
};

export function FoodFeedbackDialog({ mealId, foodName, mealTitle, onConfirm, onCancel }: FoodFeedbackDialogProps) {
  const open = mealId !== null;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<FoodFeedback | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Substitutos do mesmo grupo, já na porção com as mesmas calorias, escolhidos pelo backend.
  const substitutes = useApiQuery<PlanFood[]>(
    open ? `/plan/meals/${mealId}/substitutes?food=${encodeURIComponent(foodName)}` : null
  );
  const options = substitutes.data ?? [];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setReason(null);
      setChoice(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const hasOptions = options.length > 0;
  const descriptions: Record<FoodFeedback, string> = {
    "nao-gosto": `${foodName} sai de todas as refeições, também nos próximos dias.`,
    "nao-quero": `${foodName} sai só de “${mealTitle}”, também nos próximos dias. As outras refeições continuam com ele.`,
    "nao-tenho": `${foodName} sai de todas as refeições, também nos próximos dias.`,
  };

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
        onSubmit={async (event) => {
          event.preventDefault();
          if (!reason || !substitutes.data || (hasOptions && !choice)) return;
          setSubmitting(true);
          await onConfirm(reason, hasOptions ? choice : null);
          setSubmitting(false);
        }}
      >
        <h4 className="font-semibold text-neutral-900">Substituir alimento?</h4>
        <p className="mt-1 text-sm text-neutral-600">Por que trocar &ldquo;{foodName}&rdquo;?</p>

        <fieldset className="mt-4 flex min-w-0 flex-col gap-2">
          <legend className="sr-only">Motivo da troca</legend>
          {FOOD_FEEDBACK.map(({ id, label, Icon }) => (
            <label
              key={id}
              className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                reason === id ? "border-accent bg-accent/5" : "border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name="food-feedback-reason"
                value={id}
                checked={reason === id}
                onChange={() => setReason(id)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                  <Icon size={15} className="text-neutral-400" /> {label}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500">{descriptions[id]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {!substitutes.data ? (
          <div className="mt-4 flex min-h-16 flex-col items-center justify-center gap-2 text-center">
            {substitutes.error ? (
              <>
                <p className="text-sm text-neutral-600">{substitutes.error.message}</p>
                <button
                  type="button"
                  onClick={substitutes.reload}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Tentar novamente
                </button>
              </>
            ) : (
              <Spinner className="h-6 w-6" />
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            {hasOptions
              ? "Escolha um substituto, com as mesmas calorias:"
              : "Não há outros alimentos do mesmo grupo disponíveis, então ele sairá sem substituto."}
          </p>
        )}

        {hasOptions && (
          <fieldset className="mt-2 flex min-w-0 flex-col gap-2">
            <legend className="sr-only">Substituto</legend>
            {options.map((option) => (
              <label
                key={option.name}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                  choice === option.name ? "border-accent bg-accent/5" : "border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <input
                  type="radio"
                  name="food-substitute"
                  value={option.name}
                  checked={choice === option.name}
                  onChange={() => setChoice(option.name)}
                  className="h-4 w-4 shrink-0 accent-accent"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-neutral-900">{option.name}</span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    {option.carbs}g carb. · {option.protein}g prot. · {option.fat}g gord.
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs tabular-nums text-neutral-500">
                  <span className="block font-medium text-neutral-800">{option.grams} g</span>
                  {option.kcal} kcal
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <p className="mt-3 text-xs text-neutral-500">
          O assistente deixa de recomendar {foodName} até você liberar na página Alimentos.
        </p>

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
            disabled={reason === null || !substitutes.data || (hasOptions && choice === null) || submitting}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </form>
    </dialog>
  );
}
