"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { FOOD_FEEDBACK, type FoodFeedback } from "@/lib/food-feedback";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { PlanFood } from "@/lib/api/types";
import { Spinner } from "@/components/api/QueryStatus";

/** Quantos nomes já mostrados o backend aceita no "Ver mais"; com isso na tela, o botão some. */
const MAX_SHOWN_SUBSTITUTES = 64;
/** Escolha "Sem substituto": o alimento sai sem outro no lugar. */
const NO_SUBSTITUTE = "";

type FoodFeedbackDialogProps = {
  /** Refeição onde o botão foi clicado ("Não quero" troca só nela); `null` = diálogo fechado. */
  mealId: number | null;
  foodName: string;
  mealTitle: string;
  onConfirm: (reason: FoodFeedback, substitute: string | null) => Promise<void>;
  onCancel: () => void;
};

/**
 * Troca de alimento: o motivo e o substituto. O diálogo abre sem pedir nada ao backend: quem já sabe o que quer
 * comer pesquisa; "Sugerir" traz as sugestões do assistente (com "Ver mais").
 */
export function FoodFeedbackDialog({ mealId, foodName, mealTitle, onConfirm, onCancel }: FoodFeedbackDialogProps) {
  const open = mealId !== null;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<FoodFeedback | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  // O que está na lista: nada ainda, o resultado da pesquisa ou as sugestões.
  const [mode, setMode] = useState<"none" | "search" | "suggest">("none");
  const [options, setOptions] = useState<PlanFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  // Só a resposta do último pedido vale (o usuário pode pesquisar de novo antes de a anterior chegar).
  const lastRequest = useRef(0);
  const substitutesPath = `/plan/meals/${mealId}/substitutes?food=${encodeURIComponent(foodName)}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      lastRequest.current++;
      setReason(null);
      setChoice(null);
      setQuery("");
      setMode("none");
      setOptions([]);
      setLoading(false);
      setError(null);
      setExhausted(false);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  /** Pede a lista ao backend; `append` = "Ver mais" (soma às opções e mantém a escolha). */
  async function load(nextMode: "search" | "suggest", path: string, append = false) {
    const request = ++lastRequest.current;
    setLoading(true);
    setError(null);
    if (!append) {
      setMode(nextMode);
      setOptions([]);
      setExhausted(false);
      // Um alimento da lista anterior sai junto com ela; "Sem substituto" continua escolhido.
      setChoice((current) => (current === NO_SUBSTITUTE ? current : null));
    }
    try {
      const found = await apiFetch<PlanFood[]>(path);
      if (request !== lastRequest.current) return;
      if (append && found.length === 0) setExhausted(true);
      setOptions((current) => (append ? [...current, ...found] : found));
    } catch (loadError) {
      if (request !== lastRequest.current) return;
      setError(loadError instanceof ApiError ? loadError.message : "Erro inesperado.");
    } finally {
      if (request === lastRequest.current) setLoading(false);
    }
  }

  function search() {
    const text = query.trim();
    if (text) void load("search", `${substitutesPath}&q=${encodeURIComponent(text)}`);
  }

  function suggest() {
    void load("suggest", substitutesPath);
  }

  function loadMore() {
    const exclude = options.map((option) => `&exclude=${encodeURIComponent(option.name)}`).join("");
    void load("suggest", `${substitutesPath}${exclude}`, true);
  }

  const canLoadMore =
    mode === "suggest" && options.length > 0 && !exhausted && options.length < MAX_SHOWN_SUBSTITUTES;

  const descriptions: Record<FoodFeedback, string> = {
    "nao-gosto": `${foodName} sai de todas as refeições.`,
    "nao-quero": `${foodName} sai só de “${mealTitle}”. As outras refeições continuam com ele.`,
    "nao-tenho": `${foodName} sai de todas as refeições.`,
    "nao-posso": `${foodName} sai de todas as refeições.`,
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
      className="m-auto w-[calc(100%-2rem)] max-w-4xl rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <form
        className="p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!reason || choice === null) return;
          setSubmitting(true);
          await onConfirm(reason, choice === NO_SUBSTITUTE ? null : choice);
          setSubmitting(false);
        }}
      >
        <h4 className="font-semibold text-neutral-900">Substituir alimento?</h4>
        <p className="mt-1 text-sm text-neutral-600">Por que trocar &ldquo;{foodName}&rdquo;?</p>

        <fieldset className="mt-4 grid min-w-0 grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))] gap-2">
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

        <p className="mt-5 text-sm font-medium text-neutral-900">Substituir por</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Pesquise o alimento que você quer ou peça uma sugestão. A porção fica com as mesmas calorias.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            type="text"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              // Enter pesquisa em vez de enviar o formulário.
              if (event.key === "Enter") {
                event.preventDefault();
                search();
              }
            }}
            placeholder="Pesquisar alimento…"
            aria-label="Pesquisar alimento"
            className="min-w-0 flex-1 basis-48 rounded-xl bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="button"
            onClick={search}
            disabled={!query.trim()}
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Search size={16} /> Pesquisar
          </button>
          <button
            type="button"
            onClick={suggest}
            className="flex items-center gap-1.5 rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent/5"
          >
            <Sparkles size={16} /> Sugerir
          </button>
        </div>

        <fieldset className="mt-3 grid min-w-0 grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))] gap-2">
          <legend className="sr-only">Substituto</legend>
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
              choice === NO_SUBSTITUTE ? "border-accent bg-accent/5" : "border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <input
              type="radio"
              name="food-substitute"
              value={NO_SUBSTITUTE}
              checked={choice === NO_SUBSTITUTE}
              onChange={() => setChoice(NO_SUBSTITUTE)}
              className="h-4 w-4 shrink-0 accent-accent"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-neutral-900">Sem substituto</span>
              <span className="mt-0.5 block text-xs text-neutral-500">O alimento sai sem outro no lugar.</span>
            </span>
          </label>
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
                  <span className="block break-words text-sm font-medium text-neutral-900">{option.name}</span>
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

        {mode !== "none" && (
          <div className="mt-3 flex min-h-6 flex-col items-center gap-1 text-center">
            {loading ? (
              <Spinner className="h-5 w-5" />
            ) : canLoadMore ? (
              <button type="button" onClick={loadMore} className="text-sm font-medium text-accent hover:underline">
                Ver mais
              </button>
            ) : exhausted ? (
              <p className="text-sm text-neutral-500">Não há mais opções.</p>
            ) : (
              !error &&
              options.length === 0 && <p className="text-sm text-neutral-500">Nenhum alimento encontrado.</p>
            )}
            {error && <p className="text-sm text-neutral-600">{error}</p>}
          </div>
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
            disabled={reason === null || choice === null || submitting}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </form>
    </dialog>
  );
}
