"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, type PieLabelRenderProps } from "recharts";
import { MoreHorizontal, GlassWater } from "lucide-react";
import { dailyCalorieGoal, dailyWaterGoal, macroBreakdown } from "@/lib/mock-data";
import { ProgressBar } from "@/components/dashboard/ProgressBar";

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

      <div className="mt-4 flex flex-1 flex-col items-center gap-6 sm:flex-row sm:gap-10">
        <div className="relative h-48 w-48 shrink-0 sm:h-56 sm:w-56">
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
                isAnimationActive={false}
              >
                {macroBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex w-full flex-1 flex-col gap-3">
          {macroBreakdown.map((macro) => (
            <ProgressBar
              key={macro.name}
              label={macro.name}
              atual={macro.atual}
              meta={macro.meta}
              unit="g"
              color={macro.color}
            />
          ))}

          <div className="mt-1 flex items-center gap-2 border-t border-neutral-100 pt-3 text-sm">
            <GlassWater size={16} className="text-[#7fc1e8]" />
            <span className="text-neutral-700">Água</span>
            <span className="ml-auto font-semibold text-neutral-900">{dailyWaterGoal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
