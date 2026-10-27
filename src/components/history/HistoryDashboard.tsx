"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/api/query";
import type { ActivityHistory, ActivitySource, HistorySummary } from "@/lib/api/types";
import { QueryStatus } from "@/components/api/QueryStatus";
import { StatTile } from "@/components/history/StatTile";
import { BalanceChart } from "@/components/history/BalanceChart";
import { WeightChart } from "@/components/history/WeightChart";
import { ActivityPanel } from "@/components/history/ActivityPanel";
import { NutrientChart } from "@/components/history/NutrientChart";
import { formatSigned, numberFormat } from "@/components/history/format";

/** Últimos 7 ou 30 dias, ou "all": desde a criação da conta (o backend nunca mostra antes dela). */
export type HistoryPeriod = 7 | 30 | "all";

const PERIODS: { value: HistoryPeriod; label: string }[] = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: "all", label: "Todos" },
];

export function HistoryDashboard() {
  const [period, setPeriod] = useState<HistoryPeriod>(30);
  // Médias, dias na meta e totais já vêm calculados do backend para o período escolhido.
  const summary = useApiQuery<HistorySummary>(`/history/summary?days=${period}`);
  const activity = useApiQuery<ActivityHistory>(`/history/activity?days=${period}`);
  const sources = useApiQuery<ActivitySource[]>("/activity-sources");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">Histórico</h2>
        <div role="group" aria-label="Período" className="flex gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={period === item.value}
              onClick={() => setPeriod(item.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                period === item.value ? "bg-accent text-white" : "bg-accent/15 text-accent hover:bg-accent/25"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {summary.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Média consumida" value={numberFormat.format(summary.data.avgConsumed)} unit="kcal/dia" />
          <StatTile
            label="Média gasta"
            value={summary.data.avgBurned === null ? "—" : numberFormat.format(summary.data.avgBurned)}
            unit={summary.data.avgBurned === null ? undefined : "kcal/dia"}
            hint={summary.data.avgBurned === null ? "Sem dados de atividade" : undefined}
          />
          <StatTile
            label="Saldo médio"
            value={summary.data.avgBalance === null ? "—" : formatSigned(summary.data.avgBalance)}
            unit={summary.data.avgBalance === null ? undefined : "kcal/dia"}
            hint={
              summary.data.avgBalance === null
                ? undefined
                : summary.data.avgBalance < 0
                  ? "Déficit calórico"
                  : summary.data.avgBalance > 0
                    ? "Superávit calórico"
                    : "Equilíbrio"
            }
          />
          <StatTile
            label="Dias dentro da meta"
            value={`${summary.data.daysOnGoal}/${summary.data.totalDays}`}
            hint={`Até ${summary.data.goalTolerance} kcal da meta de ${numberFormat.format(summary.data.calorieGoal)}`}
          />
        </div>
      ) : (
        <QueryStatus error={summary.error} onRetry={summary.reload} />
      )}

      <WeightChart period={period} />
      {activity.data && summary.data ? (
        <BalanceChart days={activity.data.days} goal={summary.data.calorieGoal} />
      ) : (
        <QueryStatus
          title="Calorias Consumidas vs Gastas"
          error={activity.error ?? summary.error}
          onRetry={() => (activity.error ? activity.reload() : summary.reload())}
        />
      )}
      <NutrientChart period={period} />
      {activity.data ? (
        <ActivityPanel activity={activity.data} sources={sources.data ?? []} />
      ) : (
        <QueryStatus title="Atividade Física" error={activity.error} onRetry={activity.reload} />
      )}
    </>
  );
}
