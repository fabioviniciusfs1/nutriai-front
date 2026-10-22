"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { MacroNutrient, NutritionToday } from "@/lib/api/types";
import { MACRO_COLORS } from "@/lib/nutrients";

/** Rosca (com uma barra por macro ao lado) da parte das calorias de hoje que vem de cada macro (% calculados pelo backend). */
export function MacroSplitChart({
  macros,
  split,
}: {
  /** Na ordem das fatias. */
  macros: MacroNutrient[];
  split: NutritionToday["macroSplit"];
}) {
  if (!split)
    return <p className="text-sm text-neutral-500">Nada consumido hoje.</p>;
  const slices = macros.map((macro) => ({
    id: macro.id,
    name: macro.name,
    value: split[macro.id],
  }));

  return (
    // Mesma disposição da linha de cima do card: a rosca com a largura do semicírculo de calorias.
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
      <div className="aspect-square w-56 shrink-0 sm:w-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
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
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex w-full min-w-0 flex-1 flex-col gap-4">
        {slices.map((slice) => (
          <li key={slice.id} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: MACRO_COLORS[slice.id] }}
              />
              <span className="text-neutral-700">{slice.name}</span>
              <span className="ml-auto font-semibold tabular-nums text-neutral-900">
                {slice.value}%
              </span>
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
                style={{
                  width: `${slice.value}%`,
                  backgroundColor: MACRO_COLORS[slice.id],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
