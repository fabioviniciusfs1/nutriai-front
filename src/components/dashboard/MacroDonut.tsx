"use client";

import { useAuth } from "@/lib/auth";
import { useApiQuery } from "@/lib/api/query";
import type { NutritionToday, TodayPlan } from "@/lib/api/types";
import { TODAY_PLAN_PATH } from "@/lib/api/actions";
import { CALORIE_COLOR, FIBER_COLOR, MACRO_COLORS, MACRO_ORDER, WATER_COLOR } from "@/lib/nutrients";
import { QueryStatus } from "@/components/api/QueryStatus";
import { MacroSplitChart } from "@/components/dashboard/MacroSplitChart";

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

/** g/kg e kcal/kg com uma casa; ml/kg (água) inteiro. */
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

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">Meta diária: {calorieGoal}</h3>

      {/* Total de hoje e por kg de peso (vêm prontos do backend), sem a meta. */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <TotalTile
          name="Calorias"
          color={CALORIE_COLOR}
          total={numberFormat.format(consumed)}
          unit="kcal"
          perKg={formatPerKg(nutrition.kcalPerKg, "kcal/kg")}
        />
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

      <div className="mt-6">
        <MacroSplitChart macros={macros} split={nutrition.macroSplit} burned={burned} />
      </div>
    </div>
  );
}
