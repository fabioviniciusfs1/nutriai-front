"use client";

import { useEffect, useRef, useState } from "react";
import type { PlanFood } from "@/lib/food-substitution";

type FoodFeedbackDialogProps = {
  open: boolean;
  foodName: string;
  /** "Não gosto", "Não quero" ou "Não tenho". */
  feedbackLabel: string;
  /** "Não quero": nome da única refeição onde a troca vale. `null` = todas as refeições. */
  onlyThisMeal: string | null;
  /** Substitutos já na porção com as mesmas calorias do alimento marcado. */
  options: PlanFood[];
  onConfirm: (substitute: string | null) => void;
  onCancel: () => void;
};

export function FoodFeedbackDialog({
  open,
  foodName,
  feedbackLabel,
  onlyThisMeal,
  options,
  onConfirm,
  onCancel,
}: FoodFeedbackDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setChoice(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const hasOptions = options.length > 0;

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
          if (!hasOptions) onConfirm(null);
          else if (choice) onConfirm(choice);
        }}
      >
        <h4 className="font-semibold text-neutral-900">
          Marcar &ldquo;{foodName}&rdquo; como &ldquo;{feedbackLabel}&rdquo;?
        </h4>
        <p className="mt-1 text-sm text-neutral-600">
          {onlyThisMeal ? (
            <>
              {foodName} sai só de &ldquo;{onlyThisMeal}&rdquo;, também nos próximos dias. As outras refeições
              continuam com ele.{" "}
            </>
          ) : (
            <>{foodName} sai de todas as refeições.{" "}</>
          )}
          {hasOptions
            ? "Escolha um substituto, com as mesmas calorias:"
            : "Não há outros alimentos do mesmo grupo disponíveis, então ele sairá sem substituto."}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          O assistente deixa de recomendar {foodName} até você liberar na página Alimentos.
        </p>

        {hasOptions && (
          <fieldset className="mt-4 flex min-w-0 flex-col gap-2">
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
            disabled={hasOptions && choice === null}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </form>
    </dialog>
  );
}
