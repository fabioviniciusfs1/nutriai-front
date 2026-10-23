"use client";

import { Flame } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { MacroNutrient, NutritionToday } from "@/lib/api/types";
import { MACRO_COLORS } from "@/lib/nutrients";

const numberFormat = new Intl.NumberFormat("pt-BR");

/** Cor do anel quando não há consumo hoje. */
const EMPTY_RING_COLOR = "#f5f5f5";

/**
 * Rosca (com uma barra por macro ao lado) da parte das calorias de hoje que vem de cada macro (% calculados pelo
 * backend), com as calorias gastas no centro.
 */
export function MacroSplitChart({
  macros,
  split,
  burned,
}: {
  /** Na ordem das fatias. */
  macros: MacroNutrient[];
  split: NutritionToday["macroSplit"];
  /** Gasto de hoje (Google Fit / Apple Saúde); `null` sem dados. */
  burned: number | null;
}) {
  const slices = split
    ? macros.map((macro) => ({ id: macro.id, name: macro.name, value: split[macro.id] }))
    : [];
  const burnedText = burned === null ? "—" : `${numberFormat.format(burned)} kcal`;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
      <div
        role="img"
        aria-label={`Distribuição das calorias de hoje entre os macronutrientes; calorias gastas: ${burnedText}`}
        className="relative aspect-square w-56 shrink-0 sm:w-64"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {split ? (
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="80%"
                outerRadius="98%"
                // Começa no topo e segue no sentido horário, com um vão entre as fatias.
                startAngle={90}
                endAngle={-270}
                paddingAngle={4}
                cornerRadius={4}
                stroke="none"
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.id} fill={MACRO_COLORS[slice.id]} />
                ))}
              </Pie>
            ) : (
              // Sem consumo: só o anel, para o gasto continuar no centro.
              <Pie
                data={[{ value: 1 }]}
                dataKey="value"
                innerRadius="80%"
                outerRadius="98%"
                stroke="none"
                fill={EMPTY_RING_COLOR}
                isAnimationActive={false}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Flame size={18} className="text-accent" />
          <span className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 sm:text-3xl">{burnedText}</span>
          <span className="text-xs text-neutral-500">calorias gastas</span>
        </div>
      </div>
      {split ? (
        <ul className="flex w-full min-w-0 flex-1 flex-col gap-4">
          {slices.map((slice) => (
            <li key={slice.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: MACRO_COLORS[slice.id] }} />
                <span className="text-neutral-700">{slice.name}</span>
                <span className="ml-auto font-semibold tabular-nums text-neutral-900">{slice.value}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={slice.name}
                aria-valuenow={slice.value}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-neutral-100"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${slice.value}%`, backgroundColor: MACRO_COLORS[slice.id] }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">Nada consumido hoje.</p>
      )}
    </div>
  );
}
