"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useApiQuery } from "@/lib/api/query";
import type { PlanHistoryEdit, PlanHistoryEntry } from "@/lib/api/types";
import { QueryStatus } from "@/components/api/QueryStatus";
import { formatFullDate, formatLongDate, formatTime, numberFormat } from "@/components/history/format";
import { amount, changeText } from "@/components/history/plan-format";
import { mealSlotLabel } from "@/lib/profile";
import { CALORIE_COLOR, FIBER_COLOR, MACRO_COLORS } from "@/lib/nutrients";

/** Um dia com alterações no plano. */
type EditDay = { date: string; edits: PlanHistoryEdit[] };

/** As alterações do plano por dia, na ordem delas (da mais recente para a mais antiga). */
function editDays(edits: PlanHistoryEdit[]): EditDay[] {
  const days: EditDay[] = [];
  for (const edit of edits) {
    const day = days.at(-1);
    if (day?.date === edit.date) day.edits.push(edit);
    else days.push({ date: edit.date, edits: [edit] });
  }
  return days;
}

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
                        Plano montado · {numberFormat.format(plan.totals.kcal)} kcal
                      </span>
                    </span>
                    <span className="text-xs text-neutral-500">
                      {plan.edited
                        ? `${plan.changes.length} ${plan.changes.length === 1 ? "alteração" : "alterações"}`
                        : "Plano montado pelo assistente"}
                    </span>
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
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-neutral-800">{meal.title}</span>
                          <span className="text-xs text-neutral-400">
                            {mealSlotLabel(meal.slot)} · {meal.time}
                          </span>
                          <span className="text-xs text-neutral-500 tabular-nums">{meal.kcal} kcal</span>
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

                  {plan.changes.length > 0 && <PlanEdits days={editDays(plan.changes)} />}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Alterações do plano, uma página por dia (do mais recente para os anteriores), cada uma com o horário. */
function PlanEdits({ days }: { days: EditDay[] }) {
  // 0 = o dia mais recente com alterações; as próximas, os dias anteriores.
  const [page, setPage] = useState(0);
  const day = days[page];

  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm">
      <h4 className="text-xs font-medium text-neutral-500">Alterações</h4>
      {/* A data entre as setas, numa linha só dela: cabe na largura do celular. */}
      <div className="mt-1 flex items-center justify-between gap-2">
        {days.length > 1 ? (
          <button
            type="button"
            aria-label="Dia anterior"
            disabled={page === days.length - 1}
            onClick={() => setPage(page + 1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
        ) : (
          <span className="w-8 shrink-0" />
        )}
        <span className="flex flex-col items-center text-center">
          <span className="font-medium text-neutral-800 tabular-nums">{formatFullDate(day.date)}</span>
          {days.length > 1 && (
            <span className="text-xs text-neutral-400 tabular-nums">
              {days.length - page} de {days.length}
            </span>
          )}
        </span>
        {days.length > 1 ? (
          <button
            type="button"
            aria-label="Próximo dia"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        ) : (
          <span className="w-8 shrink-0" />
        )}
      </div>
      {/* Altura máxima: um dia com muitas alterações rola aqui dentro, sem aumentar o card. */}
      <ul className="mt-2 flex max-h-60 flex-col divide-y divide-neutral-200 overflow-y-auto text-neutral-600">
        {day.edits.map((edit, index) => (
          <li key={index} className="flex min-w-0 flex-col gap-0.5 py-1.5">
            <span className="text-xs text-neutral-400">
              {edit.at && <span className="tabular-nums">{formatTime(edit.at)} · </span>}
              {edit.meal}
            </span>
            <span className="break-words">{changeText(edit)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
