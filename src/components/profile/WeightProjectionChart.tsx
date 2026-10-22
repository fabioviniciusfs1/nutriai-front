"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  type TooltipContentProps,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import type { WeightProjection } from "@/lib/api/types";

const LINE_COLOR = "#8b5cf6";

const kgFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const weightFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

type Point = WeightProjection["points"][number];

/** "AAAA-MM-DD" → "DD/MM/AAAA". */
function fullDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

/** "14 meses e 21 dias", "1 mês", "21 dias". */
function durationLabel({ months, days }: WeightProjection["duration"]) {
  const parts = [
    months > 0 && `${months} ${months === 1 ? "mês" : "meses"}`,
    (days > 0 || months === 0) && `${days} ${days === 1 ? "dia" : "dias"}`,
  ].filter(Boolean);
  return parts.join(" e ");
}

function ProjectionTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as Point;
  return (
    <div className="rounded-xl bg-neutral-800/95 p-4 text-white shadow-lg">
      <p className="mb-2 text-xs text-neutral-300">{fullDate(point.date)}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: LINE_COLOR }} />
        <span className="text-neutral-300">Peso estimado</span>
        <span className="ml-auto pl-4 font-semibold">{kgFormat.format(point.weightKg)} kg</span>
      </div>
    </div>
  );
}

/**
 * Marcas do eixo começando no menor peso (o peso meta ao perder) e seguindo em passos redondos (1, 2, 5 ou 10 kg),
 * com ~4 intervalos e 1 kg de folga em cima. Uma marca redonda colada na primeira (menos de meio passo) sai.
 */
function weightTicks(min: number, max: number) {
  const step = [1, 2, 5, 10].find((candidate) => (max - min + 1) / candidate <= 5) ?? 10;
  const last = Math.ceil((max + 1) / step) * step;
  const round: number[] = [];
  for (let tick = Math.ceil(min / step) * step; tick <= last; tick += step)
    if (tick - min >= step / 2) round.push(tick);
  return [min, ...round];
}

/** Projeção do peso até a meta, calculada pelo backend (`POST /profile/projection`). */
export function WeightProjectionChart({ projection }: { projection: WeightProjection }) {
  const { points } = projection;
  const target = points[points.length - 1];
  const values = points.map((point) => point.weightKg);
  // Eixo X só com começo, meio (o mês mais perto da metade do caminho) e fim.
  const middle = points.reduce((best, point) =>
    Math.abs(point.month - target.month / 2) < Math.abs(best.month - target.month / 2) ? point : best
  );
  const xTicks = [...new Set([0, middle.month, target.month])];
  const yTicks = weightTicks(Math.min(...values), Math.max(...values));

  return (
    <>
      <p className="mt-4 text-sm text-neutral-700">
        Você deve chegar a <strong className="font-semibold">{kgFormat.format(target.weightKg)} kg</strong> em cerca de{" "}
        <strong className="font-semibold">{durationLabel(projection.duration)}</strong>.
      </p>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ left: -8, right: 10, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="#e5e5e5" />
            <XAxis
              dataKey="month"
              type="number"
              domain={[0, target.month]}
              ticks={xTicks}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              tickFormatter={(value: number) => {
                const point = points.find((candidate) => candidate.month === value);
                return point ? fullDate(point.date) : "";
              }}
              minTickGap={16}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              domain={[yTicks[0], yTicks[yTicks.length - 1]]}
              ticks={yTicks}
              tickFormatter={(value: number) => weightFormat.format(value)}
            />
            <Tooltip content={ProjectionTooltip} cursor={{ stroke: "#d4d4d4" }} />
            <ReferenceLine y={target.weightKg} stroke="#a3a3a3" strokeDasharray="6 4" />
            <Line
              type="linear"
              dataKey="weightKg"
              stroke={LINE_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: LINE_COLOR, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
