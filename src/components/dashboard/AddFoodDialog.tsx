"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { FoodSearchResult } from "@/lib/api/types";
import { FOOD_FEEDBACK } from "@/lib/food-feedback";

type AddFoodDialogProps = {
  /** Refeição que recebe o alimento; `null` = diálogo fechado. */
  mealId: number | null;
  mealTitle: string;
  onConfirm: (foodName: string) => Promise<void>;
  onCancel: () => void;
};

export function AddFoodDialog({ mealId, mealTitle, onConfirm, onCancel }: AddFoodDialogProps) {
  const open = mealId !== null;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [result, setResult] = useState<(FoodSearchResult & { query: string }) | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setName("");
      setResult(null);
      setChoice(null);
      setBusy(false);
      setError(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  /**
   * O backend (assistente) reconhece o alimento: devolve os da base que batem com o texto, ou
   * parecidos, cada um na porção sugerida, sem os restritos pelo usuário.
   */
  async function search() {
    const query = name.trim();
    setBusy(true);
    setError(null);
    try {
      const found = await apiFetch<FoodSearchResult>(`/plan/meals/${mealId}/food-search?q=${encodeURIComponent(query)}`);
      setResult({ ...found, query });
      setChoice(found.found && found.options.length === 1 ? found.options[0].food.name : null);
    } catch (searchError) {
      setError(searchError instanceof ApiError ? searchError.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  const chosen = result?.options.find((option) => option.food.name === choice) ?? null;
  const restrictedLabel = result?.restricted
    ? (FOOD_FEEDBACK.find((item) => item.id === result.restricted?.feedback)?.label ?? "")
    : "";
  // O botão principal busca; depois da busca vira "Confirmar", até o texto mudar de novo.
  const searched = result !== null && name.trim() === result.query;

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
          if (busy) return;
          if (searched) {
            if (!chosen) return;
            setBusy(true);
            await onConfirm(chosen.food.name);
            setBusy(false);
          } else if (name.trim()) {
            await search();
          }
        }}
      >
        <h4 className="font-semibold text-neutral-900">Adicionar alimento</h4>
        <p className="mt-1 text-sm text-neutral-600">
          Diga o que você quer comer em &ldquo;{mealTitle}&rdquo;. O assistente ajusta a quantidade à sua meta
          diária.
        </p>

        <label className="sr-only" htmlFor="add-food-name">
          Alimento
        </label>
        <input
          id="add-food-name"
          type="text"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Banana"
          className="mt-4 w-full rounded-xl bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-accent"
        />

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {result && (
          <>
            <p className="mt-4 text-sm text-neutral-600">
              {result.restricted
                ? `Você marcou ${result.restricted.name} como “${restrictedLabel}” (libere na página Alimentos para usá-lo). `
                : ""}
              {result.found
                ? "Escolha o alimento, na porção sugerida pelo assistente:"
                : result.restricted
                  ? "Sugestões parecidas:"
                  : `Não encontramos “${result.query}” na base de dados. Sugestões parecidas:`}
            </p>

            {result.options.length > 0 ? (
              <fieldset className="mt-3 flex min-w-0 flex-col gap-2">
                <legend className="sr-only">Alimento</legend>
                {result.options.map(({ food: option }) => (
                  <label
                    key={option.name}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                      choice === option.name ? "border-accent bg-accent/5" : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="add-food-option"
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
            ) : (
              <p className="mt-3 text-sm text-neutral-500">Nenhum alimento disponível.</p>
            )}

            {chosen && (
              <p className="mt-3 text-xs text-neutral-500">
                Para não passar da meta diária, as porções das refeições serão reduzidas em{" "}
                {chosen.reductionPercent}%. O alimento fica na refeição até você removê-lo; aí as calorias dele
                voltam para as outras.
              </p>
            )}
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          {searched ? (
            <button
              type="submit"
              disabled={!chosen || busy}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirmar
            </button>
          ) : (
            <button
              type="submit"
              disabled={name.trim() === "" || busy}
              className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Search size={16} /> Buscar
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
