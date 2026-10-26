"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { DietAdjustment, MacroId } from "@/lib/api/types";
import { MACRO_COLORS, MACRO_ORDER } from "@/lib/nutrients";

/** Pizza da parte das calorias dos macros que vem de cada um (% calculados pelo backend), com a legenda ao lado. */
export function MacroPieChart({
  split,
  names,
}: {
  split: DietAdjustment["split"];
  names: Record<MacroId, string>;
}) {
  if (!split) return null;
  const slices = MACRO_ORDER.map((id) => ({ id, name: names[id], value: split[id] }));

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
      <div
        role="img"
        aria-label={`Distribuição das calorias: ${slices.map((slice) => `${slice.name} ${slice.value}%`).join(", ")}`}
        className="aspect-square w-48 shrink-0"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              outerRadius="98%"
              // Começa no topo e segue no sentido horário.
              startAngle={90}
              endAngle={-270}
              stroke="#fff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={MACRO_COLORS[slice.id]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex w-full flex-col gap-2">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: MACRO_COLORS[slice.id] }} />
            <span className="text-neutral-700">{slice.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-neutral-900">{slice.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
