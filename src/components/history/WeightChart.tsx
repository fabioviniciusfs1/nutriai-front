"use client";

import { useState } from "react";
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
import { Plus, Scale } from "lucide-react";
import { addWeightEntry, useAuth, type WeightEntry } from "@/lib/auth";
import { WeightDialog } from "@/components/history/WeightDialog";
import { mockWeightHistory } from "@/lib/mock-data";

const LINE_COLOR = "#8b5cf6";
const DAY_MS = 24 * 60 * 60 * 1000;

// Pesagens são registradas no fuso do usuário (diferente das datas fixas em UTC do mock).
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const longDateTime = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});
const kgFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type Point = { time: number; kg: number; previousKg: number | undefined };

function WeightTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as Point;
  const text = longDateTime.format(new Date(point.time));

  return (
    <div className="rounded-xl bg-neutral-800/95 p-4 text-white shadow-lg">
      <p className="mb-2 text-xs text-neutral-300">{text.charAt(0).toUpperCase() + text.slice(1)}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: LINE_COLOR }} />
        <span className="text-neutral-300">Peso</span>
        <span className="ml-auto pl-4 font-semibold">{kgFormat.format(point.kg)} kg</span>
      </div>
      {point.previousKg !== undefined && (
        <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2 text-sm">
          <span className="text-neutral-300">Desde o registro anterior</span>
          <span className="ml-auto pl-4 font-semibold">{formatKgChange(point.kg - point.previousKg)} kg</span>
        </div>
      )}
    </div>
  );
}

function formatKgChange(diff: number) {
  const rounded = Math.round(diff * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${kgFormat.format(Math.abs(rounded))}`;
}

/** Marcas do eixo em passos redondos (1, 2 ou 5 kg), com ~4 intervalos e 1 kg de folga. */
function weightTicks(min: number, max: number) {
  const step = [1, 2, 5, 10].find((candidate) => (max - min + 2) / candidate <= 5) ?? 10;
  const first = Math.floor((min - 1) / step) * step;
  const last = Math.ceil((max + 1) / step) * step;
  return Array.from({ length: Math.round((last - first) / step) + 1 }, (_, i) => first + i * step);
}

type WeightChartProps = {
  /** Últimos N dias, o mesmo período dos outros gráficos. */
  period: number;
};

export function WeightChart({ period }: WeightChartProps) {
  const auth = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const realEntries: WeightEntry[] = auth?.weights ?? [];
  // Antes do primeiro registro real entra um histórico simulado, como nos outros gráficos.
  const entries = realEntries.length > 0 ? [...mockWeightHistory(realEntries[0]), ...realEntries] : [];
  const profileKg = auth?.profile?.weightKg;

  // O eixo termina no momento em que a página abriu, ou no último registro se ele for mais recente.
  const lastEntry = entries[entries.length - 1];
  const [openedAt] = useState(() => Date.now());
  const end = Math.max(openedAt, lastEntry ? new Date(lastEntry.at).getTime() : 0);
  const start = end - period * DAY_MS;

  const points: Point[] = entries
    .map((entry, index) => ({
      time: new Date(entry.at).getTime(),
      kg: entry.kg,
      previousKg: entries[index - 1]?.kg,
    }))
    .filter((point) => point.time >= start);

  const values = points.map((point) => point.kg);
  const yTicks = weightTicks(Math.min(...values, profileKg ?? Infinity), Math.max(...values, profileKg ?? -Infinity));
  const change = points.length >= 2 ? points[points.length - 1].kg - points[0].kg : null;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-neutral-900">Peso</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {lastEntry
              ? `Último registro: ${kgFormat.format(lastEntry.kg)} kg em ${dateTime.format(new Date(lastEntry.at)).replace(",", " às")}`
              : "Registre seu peso para acompanhar a evolução."}
            {change !== null && ` · ${formatKgChange(change)} kg no período`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          <Plus size={16} /> Registrar peso
        </button>
      </div>

      {points.length > 0 ? (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: LINE_COLOR }} /> Peso registrado
            </span>
            {profileKg !== undefined && (
              <span className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-neutral-400" /> Peso do perfil (
                {kgFormat.format(profileKg)} kg, usado no gasto basal)
              </span>
            )}
          </div>

          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ left: -8, right: 10, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="#e5e5e5" />
                <XAxis
                  dataKey="time"
                  type="number"
                  scale="time"
                  domain={[start, end]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a3a3a3", fontSize: 12 }}
                  tickFormatter={(value: number) => shortDate.format(new Date(value))}
                  minTickGap={24}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a3a3a3", fontSize: 12 }}
                  tickFormatter={(value: number) => `${value}`}
                  domain={[yTicks[0], yTicks[yTicks.length - 1]]}
                  ticks={yTicks}
                />
                <Tooltip content={WeightTooltip} cursor={{ stroke: "#d4d4d4" }} />
                {profileKg !== undefined && <ReferenceLine y={profileKg} stroke="#a3a3a3" strokeDasharray="6 4" />}
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke={LINE_COLOR}
                  strokeWidth={2}
                  // Pesagens são esparsas: cada ponto é um registro, então fica visível.
                  dot={{ r: 4, fill: LINE_COLOR, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="mt-4 flex h-40 flex-col items-center justify-center gap-2 rounded-xl bg-neutral-50 text-center text-sm text-neutral-500">
          <Scale size={24} className="text-neutral-400" />
          {entries.length > 0
            ? `Nenhum peso registrado nos últimos ${period} dias.`
            : "Nenhum peso registrado ainda."}
        </div>
      )}

      <WeightDialog
        open={dialogOpen}
        lastKg={lastEntry?.kg}
        onConfirm={(kg, at) => {
          addWeightEntry(kg, at);
          setDialogOpen(false);
        }}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
