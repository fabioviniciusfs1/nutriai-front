"use client";

import { useEffect, useRef } from "react";
import type { DietPreview as DietPreviewData, PlanHistoryChange } from "@/lib/api/types";
import { numberFormat } from "@/components/history/format";
import { amount, changeText } from "@/components/history/plan-format";
import { mealSlotLabel } from "@/lib/profile";
import { CALORIE_COLOR, FIBER_COLOR, MACRO_COLORS } from "@/lib/nutrients";

type DietPreviewProps = {
  preview: DietPreviewData;
  busy: boolean;
  onBack: () => void;
  onApprove: () => void;
};

/** Mudanças agrupadas por refeição, na ordem em que aparecem. */
function byMeal(changes: PlanHistoryChange[]) {
  const groups = new Map<string, PlanHistoryChange[]>();
  for (const change of changes) groups.set(change.meal, [...(groups.get(change.meal) ?? []), change]);
  return [...groups];
}

/** Prévia do plano com o ajuste da dieta: totais atual → novo, o que muda e o plano novo. */
export function DietPreview({ preview, busy, onBack, onApprove }: DietPreviewProps) {
  const ref = useRef<HTMLElement>(null);
  // Abre abaixo dos controles: rola até ela.
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const { current, next } = preview;
  const totals = [
    { label: "Calorias", unit: " kcal", from: current.kcal, to: next.kcal, color: CALORIE_COLOR },
    { label: "Proteínas", unit: " g", from: current.protein, to: next.protein, color: MACRO_COLORS.proteinas },
    { label: "Carboidratos", unit: " g", from: current.carbs, to: next.carbs, color: MACRO_COLORS.carboidratos },
    { label: "Gorduras", unit: " g", from: current.fat, to: next.fat, color: MACRO_COLORS.gorduras },
    { label: "Fibras", unit: " g", from: current.fiber, to: next.fiber, color: FIBER_COLOR },
  ];

  return (
    <section ref={ref} className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">Prévia do plano</h3>
      <p className="mt-1 text-sm text-neutral-500">É assim que o seu plano fica com o ajuste. Nada foi salvo ainda.</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {totals.map((total) => (
          <div key={total.label} className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <dt className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: total.color }} />
              {total.label}
            </dt>
            <dd className="font-medium text-neutral-900 tabular-nums">
              {numberFormat.format(total.from)} → {numberFormat.format(total.to)}
              {total.unit}
            </dd>
          </div>
        ))}
      </dl>

      <h4 className="mt-5 text-sm font-semibold text-neutral-900">O que muda</h4>
      {preview.changes.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">O plano não muda com este ajuste.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {byMeal(preview.changes).map(([meal, changes]) => (
            <li key={meal} className="text-sm">
              <span className="font-medium text-neutral-800">{meal}</span>
              <ul className="mt-0.5 flex flex-col gap-0.5 text-neutral-600">
                {changes.map((change, index) => (
                  <li key={index}>{changeText(change)}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <h4 className="mt-5 text-sm font-semibold text-neutral-900">Plano novo</h4>
      <ul className="mt-2 flex flex-col gap-2">
        {preview.meals.map((meal, index) => (
          <li key={index} className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm">
            <div className="flex items-baseline gap-3">
              <span className="shrink-0 text-xs text-neutral-400">
                {mealSlotLabel(meal.slot)} · {meal.time}
              </span>
              <span className="flex-1 font-medium text-neutral-800">{meal.title}</span>
              <span className="text-neutral-500">{meal.kcal} kcal</span>
            </div>
            <ul className="mt-1 flex flex-col gap-0.5 text-neutral-600">
              {meal.foods.map((food, foodIndex) => (
                <li key={foodIndex} className="flex justify-between gap-3">
                  <span className="min-w-0">{food.name}</span>
                  <span className="shrink-0 text-neutral-500 tabular-nums">{amount(food)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-60"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          Aprovar ajuste
        </button>
      </div>
    </section>
  );
}
