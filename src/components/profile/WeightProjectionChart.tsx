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
const monthFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

type Point = WeightProjection["points"][number];

function monthLabel(month: number) {
  return month === 0 ? "Hoje" : `${monthFormat.format(month)} ${month === 1 ? "mês" : "meses"}`;
}

function ProjectionTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as Point;
  return (
    <div className="rounded-xl bg-neutral-800/95 p-4 text-white shadow-lg">
      <p className="mb-2 text-xs text-neutral-300">{monthLabel(point.month)}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: LINE_COLOR }} />
        <span className="text-neutral-300">Peso estimado</span>
        <span className="ml-auto pl-4 font-semibold">{kgFormat.format(point.weightKg)} kg</span>
      </div>
    </div>
  );
}

/** Marcas do eixo em passos redondos (1, 2 ou 5 kg), com ~4 intervalos e 1 kg de folga. */
function weightTicks(min: number, max: number) {
  const step = [1, 2, 5, 10].find((candidate) => (max - min + 2) / candidate <= 5) ?? 10;
  const first = Math.floor((min - 1) / step) * step;
  const last = Math.ceil((max + 1) / step) * step;
  return Array.from({ length: Math.round((last - first) / step) + 1 }, (_, i) => first + i * step);
}

/** Projeção do peso até a meta, calculada pelo backend (`POST /profile/projection`). */
export function WeightProjectionChart({ projection }: { projection: WeightProjection }) {
  const { points } = projection;
  const target = points[points.length - 1];
  const values = points.map((point) => point.weightKg);
  const yTicks = weightTicks(Math.min(...values), Math.max(...values));

  return (
    <>
      <p className="mt-4 text-sm text-neutral-700">
        Você deve chegar a <strong className="font-semibold">{kgFormat.format(target.weightKg)} kg</strong> em cerca de{" "}
        <strong className="font-semibold">{monthLabel(projection.months)}</strong> (≈{" "}
        {kgFormat.format(Math.abs(projection.weeklyChangeKg))} kg por semana).
      </p>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ left: -8, right: 10, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="#e5e5e5" />
            <XAxis
              dataKey="month"
              type="number"
              domain={[0, target.month]}
              ticks={points.map((point) => point.month)}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              tickFormatter={(value: number) => (value === 0 ? "Hoje" : `${monthFormat.format(value)}m`)}
              minTickGap={16}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              domain={[yTicks[0], yTicks[yTicks.length - 1]]}
              ticks={yTicks}
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
