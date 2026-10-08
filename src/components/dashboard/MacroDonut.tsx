"use client";

import { MoreHorizontal, GlassWater, Flame } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useApiQuery } from "@/lib/api/query";
import type { NutritionToday, TodayPlan } from "@/lib/api/types";
import { TODAY_PLAN_PATH } from "@/lib/api/actions";
import { MACRO_COLORS } from "@/lib/nutrients";
import { QueryStatus } from "@/components/api/QueryStatus";
import { ProgressBar } from "@/components/dashboard/ProgressBar";

// Semicírculo de raio 80 centrado em (100, 100); `pathLength` 100 deixa o progresso em %.
const ARC = "M 20 100 A 80 80 0 0 1 180 100";

const numberFormat = new Intl.NumberFormat("pt-BR");

export function MacroDonut() {
  const nutrition = useApiQuery<NutritionToday>("/nutrition/today");
  // Enquanto o assistente monta o plano individual, o consumo de hoje ainda é o do plano padrão: espera.
  const personalizing = useApiQuery<TodayPlan>(TODAY_PLAN_PATH).data?.personalization === "pending";
  if (!nutrition.data || personalizing)
    return <QueryStatus title="Meta diária" error={nutrition.error} onRetry={nutrition.reload} />;
  return <MacroDonutCard nutrition={nutrition.data} />;
}

function MacroDonutCard({ nutrition }: { nutrition: NutritionToday }) {
  // Metas do perfil (calculadas pelo backend) e consumo/gasto de hoje.
  const targets = useAuth()?.targets;
  const consumed = nutrition.consumedKcal;
  const burned = nutrition.burnedKcal;
  const target = targets?.calories ?? null;
  const calorieGoal = target ? `${numberFormat.format(target)} kcal` : "—";
  const waterGoal = targets ? `${numberFormat.format(targets.waterLiters)} L` : "—";
  const percent = target ? Math.round((consumed / target) * 100) : 0;

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Meta diária: {calorieGoal}</h3>
        <button
          type="button"
          aria-label="Mais opções"
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center gap-6 sm:flex-row sm:gap-10">
        <div className="flex w-56 shrink-0 flex-col items-center sm:w-64">
          <div className="relative w-full">
            <svg
              viewBox="0 0 200 110"
              className="w-full"
              role="img"
              aria-label={
                target
                  ? `${numberFormat.format(consumed)} de ${numberFormat.format(target)} kcal consumidas (${percent}%)`
                  : "Calorias consumidas"
              }
            >
              <path d={ARC} pathLength={100} fill="none" strokeWidth={16} strokeLinecap="round" className="stroke-neutral-100" />
              {percent > 0 && (
                <path
                  d={ARC}
                  pathLength={100}
                  fill="none"
                  strokeWidth={16}
                  strokeLinecap="round"
                  // Acima da meta o arco fica cheio.
                  strokeDasharray={`${Math.min(percent, 100)} 100`}
                  className="stroke-accent"
                />
              )}
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <span className="text-2xl font-bold tabular-nums text-neutral-900 sm:text-3xl">
                {numberFormat.format(consumed)}
              </span>
              <span className="text-xs text-neutral-500">kcal consumidas</span>
            </div>
          </div>

          <div className="mt-3 flex w-full items-center gap-2 border-t border-neutral-100 pt-3 text-sm">
            <Flame size={16} className="text-accent" />
            <span className="text-neutral-700">Calorias gastas</span>
            <span className="ml-auto font-semibold tabular-nums text-neutral-900">
              {burned === null ? "—" : `${numberFormat.format(burned)} kcal`}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col gap-3">
          {nutrition.macros.map((macro) =>
            // Com perfil, em g por kg de peso (vem pronto do backend); sem perfil, em gramas.
            macro.perKg ? (
              <ProgressBar
                key={macro.id}
                label={macro.name}
                atual={macro.perKg.atual}
                meta={macro.perKg.meta}
                unit=" g/kg"
                fractionDigits={1}
                color={MACRO_COLORS[macro.id]}
              />
            ) : (
              <ProgressBar
                key={macro.id}
                label={macro.name}
                atual={macro.atual}
                meta={macro.meta}
                unit="g"
                color={MACRO_COLORS[macro.id]}
              />
            )
          )}

          <div className="mt-1 flex items-center gap-2 border-t border-neutral-100 pt-3 text-sm">
            <GlassWater size={16} className="text-[#7fc1e8]" />
            <span className="text-neutral-700">Água</span>
            <span className="ml-auto font-semibold text-neutral-900">{waterGoal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
