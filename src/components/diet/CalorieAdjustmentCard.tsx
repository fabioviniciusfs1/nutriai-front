"use client";

import { useState } from "react";
import { Flame, Minus, Plus } from "lucide-react";
import { invalidate, useApiQuery } from "@/lib/api/query";
import { CALORIES_PATH, stepCalories } from "@/lib/api/actions";
import type { CalorieAdjustment, CalorieStep } from "@/lib/api/types";
import { saveTargetWeight } from "@/lib/auth";
import { QueryStatus } from "@/components/api/QueryStatus";

const TITLE = "Calorias da dieta";
const numberFormat = new Intl.NumberFormat("pt-BR");
const kgFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** O botão que a sugestão do sistema pede; `null` sem sugestão (no peso meta ou no piso). */
function suggestedStep(data: CalorieAdjustment): CalorieStep | null {
  if (data.advice?.kind === "decrease") return "decrease";
  if (data.advice?.kind === "increase") return "increase";
  return null;
}

/** Aviso antes de um ajuste que o sistema não sugeriu. */
function warning(direction: CalorieStep, data: CalorieAdjustment): string {
  if (data.goal === "manter") return "Seu objetivo é manter o peso: o sistema não recomenda mudar as calorias.";
  if (direction === "decrease" && data.goal === "ganhar")
    return "Você está ganhando peso: diminuir as calorias vai na direção contrária.";
  if (direction === "increase" && data.goal === "perder")
    return "Você ainda está emagrecendo: aumentar as calorias pode atrasar a chegada ao peso meta.";
  if (data.weeklyChangeKg === null)
    return "Ainda não há duas pesagens com uma semana de diferença desde o último ajuste para o sistema recomendar essa mudança.";
  const change = `${data.weeklyChangeKg > 0 ? "+" : ""}${kgFormat.format(data.weeklyChangeKg)}`;
  return `Na última semana seu peso variou ${change} kg: o sistema não recomenda essa mudança agora.`;
}

/**
 * Ajuste das calorias: −10% e +10% na meta em vigor, com a sugestão do sistema pelas pesagens e pelo peso meta.
 * Os botões sempre funcionam; o que não é o sugerido pede confirmação com um aviso. No peso meta, a pessoa
 * escolhe um novo: acima do peso atual para ganhar peso, abaixo para continuar emagrecendo (o backend decide).
 */
export function CalorieAdjustmentCard() {
  const { data, error, reload } = useApiQuery<CalorieAdjustment>(CALORIES_PATH);
  const [confirming, setConfirming] = useState<CalorieStep | null>(null);
  const [targetText, setTargetText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!data) return <QueryStatus title={TITLE} error={error} onRetry={reload} />;

  const suggested = suggestedStep(data);
  const reached = data.advice?.kind === "reached";
  const atFloor = data.decreaseTo >= data.calories;

  async function apply(direction: CalorieStep) {
    setBusy(true);
    await stepCalories(direction);
    setConfirming(null);
    setBusy(false);
  }

  function press(direction: CalorieStep) {
    if (direction === suggested) void apply(direction);
    else setConfirming(direction);
  }

  async function saveTarget() {
    const kg = Number(targetText?.replace(",", "."));
    if (!targetText || Number.isNaN(kg)) return;
    setBusy(true);
    if (await saveTargetWeight(kg)) {
      setTargetText(null);
      invalidate(CALORIES_PATH);
    }
    setBusy(false);
  }

  const stepButton = (direction: CalorieStep) => {
    const decrease = direction === "decrease";
    const to = decrease ? data.decreaseTo : data.increaseTo;
    return (
      <button
        type="button"
        onClick={() => press(direction)}
        disabled={busy || (decrease && atFloor)}
        className="flex items-center gap-1.5 rounded-full bg-accent/15 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/25 disabled:opacity-40"
      >
        {decrease ? <Minus size={16} /> : <Plus size={16} />}
        {decrease ? "Diminuir" : "Aumentar"} 10% ({numberFormat.format(to)} kcal)
      </button>
    );
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Flame size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-neutral-900">{TITLE}</h3>
            <p className="text-sm text-neutral-500">
              Meta de <span className="font-medium tabular-nums text-neutral-900">{numberFormat.format(data.calories)} kcal</span>{" "}
              por dia
              {data.calories !== data.profileCalories &&
                ` (pelo perfil, ${numberFormat.format(data.profileCalories)} kcal)`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {stepButton("decrease")}
          {stepButton("increase")}
        </div>
      </div>

      {data.advice && (
        <div className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm">
          <p className="font-medium text-neutral-900">{data.advice.title}</p>
          <p className="mt-0.5 text-neutral-600">{data.advice.text}</p>
          {reached && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {targetText === null ? (
                <button
                  type="button"
                  onClick={() => setTargetText("")}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
                >
                  Escolher novo peso meta
                </button>
              ) : (
                <>
                  <label className="flex items-center gap-2 text-neutral-700">
                    <span className="sr-only">Novo peso meta em kg</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      value={targetText}
                      onChange={(event) => setTargetText(event.target.value)}
                      placeholder="Ex.: 55"
                      className="w-24 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-right tabular-nums focus:border-accent focus:outline-none"
                    />
                    kg
                  </label>
                  <button
                    type="button"
                    onClick={() => void saveTarget()}
                    disabled={busy || targetText.trim() === ""}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
                  >
                    Salvar peso meta
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetText(null)}
                    className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {confirming && (
        <div role="alert" className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
          <p className="text-neutral-700">{warning(confirming, data)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void apply(confirming)}
              disabled={busy}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
            >
              {confirming === "decrease" ? "Diminuir" : "Aumentar"} mesmo assim
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
