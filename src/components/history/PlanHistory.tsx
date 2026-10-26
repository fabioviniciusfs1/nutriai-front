"use client";

import { ChevronDown } from "lucide-react";
import { useApiQuery } from "@/lib/api/query";
import type { PlanHistoryEntry } from "@/lib/api/types";
import { QueryStatus } from "@/components/api/QueryStatus";
import { formatLongDate, numberFormat } from "@/components/history/format";
import { amount, changeText } from "@/components/history/plan-format";
import { mealSlotLabel } from "@/lib/profile";
import { CALORIE_COLOR, FIBER_COLOR, MACRO_COLORS } from "@/lib/nutrients";

export function PlanHistory() {
  const { data: plans, error, reload } = useApiQuery<PlanHistoryEntry[]>("/history/plans");
  if (!plans) return <QueryStatus title="Histórico de planos" error={error} onRetry={reload} />;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">Histórico de planos</h3>
      <p className="mt-1 text-xs text-neutral-500">Toque em um plano para ver os totais e as refeições</p>

      {plans.length === 0 && <p className="mt-4 text-sm text-neutral-400">Nenhum plano ainda.</p>}

      <ul className="mt-4 flex flex-col gap-3">
        {plans.map((plan) => {
          const totals = [
            { label: "Calorias", value: `${numberFormat.format(plan.totals.kcal)} kcal`, color: CALORIE_COLOR },
            { label: "Proteínas", value: `${plan.totals.protein} g`, color: MACRO_COLORS.proteinas },
            { label: "Carboidratos", value: `${plan.totals.carbs} g`, color: MACRO_COLORS.carboidratos },
            { label: "Gorduras", value: `${plan.totals.fat} g`, color: MACRO_COLORS.gorduras },
            { label: "Fibras", value: `${plan.totals.fiber} g`, color: FIBER_COLOR },
          ];
          return (
            <li key={plan.id}>
              <details className="group rounded-xl border border-neutral-200 bg-neutral-50">
                <summary className="flex cursor-pointer list-none items-start gap-4 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="font-medium text-neutral-900">{formatLongDate(plan.date)}</span>
                      {plan.current && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Atual</span>
                      )}
                      <span className="text-xs text-neutral-500">
                        {plan.edited ? "Plano alterado" : "Plano montado"} · {numberFormat.format(plan.totals.kcal)} kcal
                      </span>
                    </span>
                    {plan.edited ? (
                      <ul className="flex flex-col gap-0.5 text-xs text-neutral-600">
                        {plan.changes.map((change, index) => (
                          <li key={index} className="min-w-0">
                            <span className="text-neutral-400">{change.meal}:</span> {changeText(change)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-neutral-500">Plano montado pelo assistente</span>
                    )}
                  </span>
                  <ChevronDown size={16} className="mt-1 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
                </summary>

                <div className="border-t border-neutral-200 px-4 pb-4">
                  <dl className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-5">
                    {totals.map((total) => (
                      <div key={total.label} className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                        <dt className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: total.color }} />
                          {total.label}
                        </dt>
                        <dd className="font-medium text-neutral-900 tabular-nums">{total.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <ul className="flex flex-col gap-2">
                    {plan.meals.map((meal, index) => (
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
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
