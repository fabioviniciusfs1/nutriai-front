"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useApiQuery } from "@/lib/api/query";
import type { ActivityDay, ActivitySource, NutrientHistoryDay, NutritionToday } from "@/lib/api/types";
import { nutrientGroups } from "@/lib/nutrients";
import { QueryStatus } from "@/components/api/QueryStatus";
import { calculateCalorieTarget } from "@/lib/calorie-target";
import { StatTile } from "@/components/history/StatTile";
import { BalanceChart } from "@/components/history/BalanceChart";
import { WeightChart } from "@/components/history/WeightChart";
import { ActivityPanel } from "@/components/history/ActivityPanel";
import { NutrientChart } from "@/components/history/NutrientChart";
import { average, formatSigned, numberFormat } from "@/components/history/format";

const PERIODS = [7, 30, 90] as const;
// Um dia conta como "dentro da meta" quando o consumo fica a até 150 kcal da meta.
const GOAL_TOLERANCE = 150;

export function HistoryDashboard() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(30);
  const profile = useAuth()?.profile;
  const calorieGoal = profile ? calculateCalorieTarget(profile).target : 2000;
  // Busca sempre o maior período e recorta: trocar de período não faz nova requisição.
  const activity = useApiQuery<ActivityDay[]>(`/history/activity?days=${PERIODS.at(-1)}`);
  const sources = useApiQuery<ActivitySource[]>("/activity-sources");
  const nutrientDays = useApiQuery<NutrientHistoryDay[]>(`/history/nutrients?days=${PERIODS.at(-1)}`);
  const nutrition = useApiQuery<NutritionToday>("/nutrition/today");
  const groups = nutrition.data ? nutrientGroups(nutrition.data) : [];

  const days = (activity.data ?? []).slice(-period);
  const avgConsumed = average(days.map((d) => d.consumed));
  const avgBurned = average(days.map((d) => d.burned));
  const avgBalance = avgConsumed - avgBurned;
  const daysOnGoal = days.filter((d) => Math.abs(d.consumed - calorieGoal) <= GOAL_TOLERANCE).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">Histórico</h2>
        <div role="group" aria-label="Período" className="flex rounded-full bg-white p-1 shadow-sm">
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={period === item}
              onClick={() => setPeriod(item)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                period === item ? "bg-accent text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {item} dias
            </button>
          ))}
        </div>
      </div>

      {activity.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Média consumida" value={numberFormat.format(avgConsumed)} unit="kcal/dia" />
          <StatTile label="Média gasta" value={numberFormat.format(avgBurned)} unit="kcal/dia" />
          <StatTile
            label="Saldo médio"
            value={formatSigned(avgBalance)}
            unit="kcal/dia"
            hint={avgBalance < 0 ? "Déficit calórico" : avgBalance > 0 ? "Superávit calórico" : "Equilíbrio"}
          />
          <StatTile
            label="Dias dentro da meta"
            value={`${daysOnGoal}/${days.length}`}
            hint={`Até ${GOAL_TOLERANCE} kcal da meta de ${numberFormat.format(calorieGoal)}`}
          />
        </div>
      ) : (
        <QueryStatus error={activity.error} onRetry={activity.reload} />
      )}

      <WeightChart period={period} />
      {activity.data && <BalanceChart days={days} goal={calorieGoal} />}
      {nutrientDays.data && groups.length > 0 ? (
        <NutrientChart days={nutrientDays.data.slice(-period)} groups={groups} />
      ) : (
        <QueryStatus
          title="Consumo de Nutrientes"
          error={nutrientDays.error ?? nutrition.error}
          onRetry={() => (nutrientDays.error ? nutrientDays.reload() : nutrition.reload())}
        />
      )}
      {activity.data && <ActivityPanel days={days} sources={sources.data ?? []} />}
    </>
  );
}
