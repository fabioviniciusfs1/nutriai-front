"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { calorieIntake } from "@/lib/mock-data";

const numberFormat = new Intl.NumberFormat("pt-BR");

function CustomTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-neutral-800/95 p-4 text-white shadow-lg">
      <p className="mb-2 text-xs text-neutral-300">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey as string} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-neutral-300">
            {item.dataKey === "calorias" ? "Calorias" : "Meta"}
          </span>
          <span className="ml-auto font-semibold">
            {numberFormat.format(Number(item.value))} kcal
          </span>
        </div>
      ))}
    </div>
  );
}

export function CalorieChart() {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900">Consumo Semanal de Calorias vs Meta</h3>
          <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Calorias
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#e9b949]" /> Meta
            </span>
          </div>
        </div>
        <button
          type="button"
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600"
        >
          Semanal
        </button>
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={calorieIntake} margin={{ left: -8, right: 10 }}>
            <defs>
              <linearGradient id="calorieFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f4623a" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f4623a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="metaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e9b949" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#e9b949" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="#e5e5e5" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              tickFormatter={(v) => numberFormat.format(v)}
              domain={[1500, 2500]}
            />
            <Tooltip content={CustomTooltip} />
            <Area
              type="monotone"
              dataKey="meta"
              stroke="#e9b949"
              strokeWidth={2}
              isAnimationActive={false}
              fill="url(#metaFill)"
            />
            <Area
              type="monotone"
              dataKey="calorias"
              stroke="#f4623a"
              strokeWidth={2}
              isAnimationActive={false}
              fill="url(#calorieFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
