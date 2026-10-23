"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { FoodSearchResult, PlanFood } from "@/lib/api/types";
import { FOOD_FEEDBACK } from "@/lib/food-feedback";

/** Limites das gramas do alimento extra (os mesmos da API). */
const MIN_GRAMS = 1;
const MAX_GRAMS = 2000;

/** Espera depois da última tecla antes de pedir a prévia das gramas. */
const PREVIEW_DELAY_MS = 300;

type AddFoodDialogProps = {
  /** Refeição que recebe o alimento; `null` = diálogo fechado. */
  mealId: number | null;
  onConfirm: (foodName: string, grams: number) => Promise<void>;
  onCancel: () => void;
};

function validGrams(text: string) {
  const grams = Number(text);
  return Number.isInteger(grams) && grams >= MIN_GRAMS && grams <= MAX_GRAMS ? grams : null;
}

export function AddFoodDialog({ mealId, onConfirm, onCancel }: AddFoodDialogProps) {
  const open = mealId !== null;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [result, setResult] = useState<(FoodSearchResult & { query: string }) | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  /** Gramas digitadas (texto, para o campo poder ficar vazio enquanto o usuário digita). */
  const [gramsText, setGramsText] = useState("");
  /** Nutrientes das gramas digitadas, calculados pela API. */
  const [preview, setPreview] = useState<PlanFood | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setName("");
      setResult(null);
      setChoice(null);
      setGramsText("");
      setPreview(null);
      setBusy(false);
      setError(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const grams = validGrams(gramsText);
  const shown = preview && preview.name === choice && preview.grams === grams ? preview : null;

  // Prévia das gramas digitadas: pede à API depois de uma pausa na digitação.
  useEffect(() => {
    if (!choice || grams === null || shown) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const food = await apiFetch<PlanFood>(
          `/plan/meals/${mealId}/food-portion?food=${encodeURIComponent(choice)}&grams=${grams}`,
        );
        if (!cancelled) setPreview(food);
      } catch (previewError) {
        if (!cancelled) setError(previewError instanceof ApiError ? previewError.message : "Erro inesperado.");
      }
    }, PREVIEW_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mealId, choice, grams, shown]);

  /** Escolhe uma opção da busca: as gramas começam vazias, para o usuário digitar. */
  function choose(food: PlanFood | null) {
    setChoice(food?.name ?? null);
    setGramsText("");
    setPreview(null);
    setError(null);
  }

  /** Alimentos da base que batem com o texto, ou parecidos, sem os restritos pelo usuário. */
  async function search() {
    const query = name.trim();
    setBusy(true);
    setError(null);
    try {
      const found = await apiFetch<FoodSearchResult>(`/plan/meals/${mealId}/food-search?q=${encodeURIComponent(query)}`);
      setResult({ ...found, query });
      choose(found.found && found.options.length === 1 ? found.options[0].food : null);
      // Busca nova: a lista volta ao começo.
      listRef.current?.scrollTo({ top: 0 });
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
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      {/* Coluna: só a lista de opções rola; título, campo, quantidade e botões ficam sempre à vista. */}
      <form
        className="flex max-h-[inherit] flex-col p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          if (searched) {
            if (!chosen || grams === null) return;
            setBusy(true);
            await onConfirm(chosen.food.name, grams);
            setBusy(false);
          } else if (name.trim()) {
            await search();
          }
        }}
      >
        <h4 className="shrink-0 font-semibold text-neutral-900">Adicionar alimento extra</h4>

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
          className="mt-4 w-full shrink-0 rounded-xl bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-accent"
        />

        {error && (
          <p role="alert" className="mt-3 shrink-0 text-sm text-red-600">
            {error}
          </p>
        )}

        {result && (
          <>
            {(result.restricted || !result.found) && (
              <p className="mt-4 shrink-0 text-sm text-neutral-600">
                {result.restricted
                  ? `Você marcou ${result.restricted.name} como “${restrictedLabel}” (libere na página Alimentos para usá-lo). `
                  : ""}
                {!result.found &&
                  (result.restricted
                    ? "Sugestões parecidas:"
                    : `Não encontramos “${result.query}” na base de dados. Sugestões parecidas:`)}
              </p>
            )}

            {result.options.length > 0 ? (
              <div
                ref={listRef}
                className="mt-3 max-h-80 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-neutral-100 p-1"
              >
                <fieldset className="flex min-w-0 flex-col gap-2">
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
                        onChange={() => choose(option)}
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
              </div>
            ) : (
              <p className="mt-3 shrink-0 text-sm text-neutral-500">Nenhum alimento disponível.</p>
            )}

            {chosen && (
              <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
                <label htmlFor="add-food-grams" className="text-sm text-neutral-700">
                  Quantidade
                </label>
                <span className="flex items-center gap-1">
                  <input
                    id="add-food-grams"
                    type="number"
                    inputMode="numeric"
                    min={MIN_GRAMS}
                    max={MAX_GRAMS}
                    step={1}
                    value={gramsText}
                    onChange={(event) => setGramsText(event.target.value)}
                    placeholder="Ex.: 100"
                    className="w-20 rounded-lg bg-neutral-50 px-2 py-1.5 text-right text-sm tabular-nums text-neutral-900 outline-none ring-2 ring-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-sm text-neutral-600">g</span>
                </span>
                <span className="text-xs tabular-nums text-neutral-500">
                  {gramsText.trim() === ""
                    ? ""
                    : grams === null
                      ? `De ${MIN_GRAMS} a ${MAX_GRAMS} g.`
                      : shown
                        ? `${shown.kcal} kcal · ${shown.carbs}g carb. · ${shown.protein}g prot. · ${shown.fat}g gord.`
                        : "Calculando…"}
                </span>
              </div>
            )}
          </>
        )}

        <div className="mt-5 flex shrink-0 justify-end gap-2">
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
              disabled={!chosen || grams === null || busy}
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
