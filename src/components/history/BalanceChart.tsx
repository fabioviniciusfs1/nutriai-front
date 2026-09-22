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
import type { activityHistory } from "@/lib/mock-data";
import { formatLongDate, formatShortDate, formatSigned, numberFormat } from "@/components/history/format";

const CONSUMED_COLOR = "#f4623a";
const BURNED_COLOR = "#3b82c4";

type BalanceChartProps = {
  days: typeof activityHistory;
  goal: number;
};

function BalanceTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const day = payload[0].payload as (typeof activityHistory)[number];
  const balance = day.consumed - day.burned;

  return (
    <div className="rounded-xl bg-neutral-800/95 p-4 text-white shadow-lg">
      <p className="mb-2 text-xs text-neutral-300">{formatLongDate(String(label))}</p>
      {[
        { name: "Consumidas", value: day.consumed, color: CONSUMED_COLOR },
        { name: "Gastas", value: day.burned, color: BURNED_COLOR },
      ].map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="text-neutral-300">{item.name}</span>
          <span className="ml-auto pl-4 font-semibold">{numberFormat.format(item.value)} kcal</span>
        </div>
      ))}
      <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2 text-sm">
        <span className="text-neutral-300">Saldo</span>
        <span className="ml-auto pl-4 font-semibold">{formatSigned(balance)} kcal</span>
      </div>
    </div>
  );
}

export function BalanceChart({ days, goal }: BalanceChartProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">Calorias Consumidas vs Gastas</h3>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: CONSUMED_COLOR }} /> Consumidas
          (plano alimentar)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: BURNED_COLOR }} /> Gastas
          (basal + atividade)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-neutral-400" /> Meta ({numberFormat.format(goal)}{" "}
          kcal)
        </span>
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={days} margin={{ left: -8, right: 10, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="#e5e5e5" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              tickFormatter={formatShortDate}
              minTickGap={24}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              tickFormatter={(v) => numberFormat.format(v)}
              domain={[1500, 2700]}
            />
            <Tooltip content={BalanceTooltip} cursor={{ stroke: "#d4d4d4" }} />
            <ReferenceLine y={goal} stroke="#a3a3a3" strokeDasharray="6 4" />
            <Line
              type="monotone"
              dataKey="consumed"
              stroke={CONSUMED_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="burned"
              stroke={BURNED_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
