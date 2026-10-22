"use client";

import { Flame } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useApiQuery } from "@/lib/api/query";
import type { NutritionToday, TodayPlan } from "@/lib/api/types";
import { TODAY_PLAN_PATH } from "@/lib/api/actions";
import { FIBER_COLOR, MACRO_COLORS, MACRO_ORDER, WATER_COLOR } from "@/lib/nutrients";
import { QueryStatus } from "@/components/api/QueryStatus";
import { MacroSplitChart } from "@/components/dashboard/MacroSplitChart";

// Semicírculo de raio 80 centrado em (100, 100); `pathLength` 100 deixa o progresso em %.
const ARC = "M 20 100 A 80 80 0 0 1 180 100";

const numberFormat = new Intl.NumberFormat("pt-BR");
const perKgFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Card de um nutriente: o total de hoje e, embaixo, por kg de peso. */
function TotalTile({
  name,
  color,
  total,
  unit,
  perKg,
}: {
  name: string;
  color: string;
  total: string;
  unit: string;
  perKg: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <span className="flex items-center gap-2 text-sm text-neutral-700">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        {name}
      </span>
      <span className="text-2xl font-semibold tabular-nums text-neutral-900">
        {total}
        <span className="ml-1 text-sm font-medium text-neutral-400">{unit}</span>
      </span>
      <span className="text-xs text-neutral-500">{perKg}</span>
    </div>
  );
}

/** g/kg com uma casa; ml/kg (água) inteiro. */
const formatPerKg = (value: number | null, unit: string) =>
  value === null ? "—" : `${(unit === "ml/kg" ? numberFormat : perKgFormat).format(value)} ${unit}`;

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
  const fiber = nutrition.fibers.find((item) => item.id === "fibras");
  const macros = MACRO_ORDER.flatMap((id) => nutrition.macros.filter((macro) => macro.id === id));
  const percent = target ? Math.round((consumed / target) * 100) : 0;

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">Meta diária: {calorieGoal}</h3>

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

          <div className="mt-3 flex w-full items-center gap-2 text-sm">
            <Flame size={16} className="text-accent" />
            <span className="text-neutral-700">Calorias gastas</span>
            <span className="ml-auto font-semibold tabular-nums text-neutral-900">
              {burned === null ? "—" : `${numberFormat.format(burned)} kcal`}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col gap-3">
          {/* Total de hoje e por kg de peso (vêm prontos do backend), sem a meta. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(4,minmax(0,12rem))]">
            {macros.map((macro) => (
              <TotalTile
                key={macro.id}
                name={macro.name}
                color={MACRO_COLORS[macro.id]}
                total={numberFormat.format(macro.atual)}
                unit={macro.unit}
                perKg={formatPerKg(macro.perKg?.atual ?? null, "g/kg")}
              />
            ))}
            {fiber && (
              <TotalTile
                name={fiber.name}
                color={FIBER_COLOR}
                total={numberFormat.format(fiber.atual)}
                unit={fiber.unit}
                perKg={formatPerKg(nutrition.fiberPerKg, "g/kg")}
              />
            )}
            <TotalTile
              name="Água"
              color={WATER_COLOR}
              total={targets ? numberFormat.format(targets.waterLiters) : "—"}
              unit="L"
              perKg={formatPerKg(targets?.waterMlPerKg ?? null, "ml/kg")}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="mb-4 text-sm font-semibold text-neutral-900">Distribuição de macronutrientes</h4>
        <MacroSplitChart macros={macros} split={nutrition.macroSplit} />
      </div>
    </div>
  );
}
