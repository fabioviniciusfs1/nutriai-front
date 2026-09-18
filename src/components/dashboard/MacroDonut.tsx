"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, type PieLabelRenderProps } from "recharts";
import { MoreHorizontal } from "lucide-react";
import { dailyCalorieGoal, macroBreakdown } from "@/lib/mock-data";

const RADIAN = Math.PI / 180;

function renderInsideLabel({ cx, cy, midAngle, innerRadius, outerRadius, value }: PieLabelRenderProps) {
  const inner = Number(innerRadius);
  const outer = Number(outerRadius);
  const centerX = Number(cx);
  const centerY = Number(cy);
  const radius = inner + (outer - inner) * 0.5;
  const x = centerX + radius * Math.cos(-midAngle! * RADIAN);
  const y = centerY + radius * Math.sin(-midAngle! * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={13}
      fontWeight={600}
      fill="#1f2421"
    >
      {`${value}%`}
    </text>
  );
}

export function MacroDonut() {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Meta diária: {dailyCalorieGoal}</h3>
        <button
          type="button"
          aria-label="Mais opções"
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className="relative mx-auto h-56 w-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macroBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius="65%"
                outerRadius="100%"
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                label={renderInsideLabel}
                labelLine={false}
              >
                {macroBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="mt-4 flex flex-col gap-3 text-sm">
          {macroBreakdown.map((macro) => (
            <li key={macro.name} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: macro.color }}
              />
              <span className="text-neutral-700">{macro.name}</span>
              <span className="ml-auto text-neutral-400">
                {macro.atual}/{macro.meta}g
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
