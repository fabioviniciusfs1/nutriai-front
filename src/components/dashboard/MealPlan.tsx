"use client";

import { useState } from "react";
import { Clock, Flame, Wheat, Drumstick, Droplet } from "lucide-react";
import { mealPlan } from "@/lib/mock-data";
import { FOOD_FEEDBACK, type FoodFeedback } from "@/lib/food-feedback";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { TimePickerDialog } from "@/components/dashboard/TimePickerDialog";
import { saveMealTime, useAuth } from "@/lib/auth";

function sumTotals(foods: (typeof mealPlan)[number]["foods"]) {
  return foods.reduce(
    (totals, food) => ({
      carbs: totals.carbs + food.carbs,
      protein: totals.protein + food.protein,
      fat: totals.fat + food.fat,
      kcal: totals.kcal + food.kcal,
    }),
    { carbs: 0, protein: 0, fat: 0, kcal: 0 }
  );
}

export function MealPlan() {
  const [time, setTime] = useState("Todos");
  const savedTimes = useAuth()?.mealTimes;
  const [editingTime, setEditingTime] = useState<{ id: number; title: string; time: string } | null>(null);
  const [feedback, setFeedback] = useState<Record<string, FoodFeedback>>({});

  const [pending, setPending] = useState<{
    foodKey: string;
    foodName: string;
    value: FoodFeedback;
  } | null>(null);

  function confirmFeedback() {
    if (!pending) return;
    const { foodKey, value } = pending;
    setFeedback((current) => {
      const next = { ...current };
      if (next[foodKey] === value) delete next[foodKey];
      else next[foodKey] = value;
      return next;
    });
    setPending(null);
  }

  const pendingLabel = FOOD_FEEDBACK.find((item) => item.id === pending?.value)?.label;
  const pendingIsRemoval = pending !== null && feedback[pending.foodKey] === pending.value;

  const plan = mealPlan
    .map((meal) => ({ ...meal, time: savedTimes?.[meal.id] ?? meal.time }))
    .sort((a, b) => a.time.localeCompare(b.time));
  const mealTimes = ["Todos", ...new Set(plan.map((meal) => meal.time))];
  const meals = plan.filter((meal) => time === "Todos" || meal.time === time);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">Plano Alimentar</h3>

      <div className="mt-4 flex flex-wrap gap-2">
        {mealTimes.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTime(item)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              time === item
                ? "bg-accent text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-4">
        {meals.map((meal) => {
          const totals = sumTotals(meal.foods);

          return (
            <li key={meal.id} className="rounded-xl border border-neutral-100 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-neutral-900">{meal.title}</p>
                <button
                  type="button"
                  title="Alterar horário da refeição"
                  aria-label={`Horário da refeição: ${meal.title}, ${meal.time}. Alterar`}
                  onClick={() => setEditingTime({ id: meal.id, title: meal.title, time: meal.time })}
                  className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
                >
                  <Clock size={12} /> {meal.time}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Flame size={14} /> {totals.kcal} kcal
                </span>
                <span className="flex items-center gap-1">
                  <Wheat size={14} /> {totals.carbs}g carboidratos
                </span>
                <span className="flex items-center gap-1">
                  <Drumstick size={14} /> {totals.protein}g proteína
                </span>
                <span className="flex items-center gap-1">
                  <Droplet size={14} /> {totals.fat}g gorduras
                </span>
              </div>

              <div className="mt-4">
                <div className="hidden sm:grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr_auto] gap-2 border-b border-neutral-100 pb-2 text-xs font-medium text-neutral-400 sm:grid">
                  <span>Alimento</span>
                  <span>Quantidade</span>
                  <span>Carb.</span>
                  <span>Prot.</span>
                  <span>Gord.</span>
                  <span>Kcal</span>
                  <span className="w-[5.75rem]" aria-hidden />
                </div>
                {meal.foods.map((food) => {
                  const foodKey = `${meal.id}-${food.name}`;
                  const selected = feedback[foodKey];

                  return (
                    <div
                      key={food.name}
                      className={`grid grid-cols-4 gap-x-2 gap-y-2 border-b border-neutral-100 py-3 text-sm text-neutral-700 last:border-b-0 sm:grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr_auto] sm:border-neutral-50 sm:py-2 ${
                        selected ? "opacity-60" : ""
                      }`}
                    >
                      <span className="col-span-3 font-medium text-neutral-900 sm:col-span-1 sm:font-normal sm:text-neutral-700">
                        {food.name}
                      </span>
                      <span className="text-right text-neutral-500 sm:text-left">{food.quantity}</span>
                      <span className="flex flex-col sm:block">
                        <span className="text-xs text-neutral-400 sm:hidden">Carb.</span>
                        {food.carbs}g
                      </span>
                      <span className="flex flex-col sm:block">
                        <span className="text-xs text-neutral-400 sm:hidden">Prot.</span>
                        {food.protein}g
                      </span>
                      <span className="flex flex-col sm:block">
                        <span className="text-xs text-neutral-400 sm:hidden">Gord.</span>
                        {food.fat}g
                      </span>
                      <span className="flex flex-col sm:block">
                        <span className="text-xs text-neutral-400 sm:hidden">Kcal</span>
                        {food.kcal}
                      </span>
                      <div className="col-span-4 flex items-center gap-1 sm:col-span-1">
                        {FOOD_FEEDBACK.map(({ id, label, Icon }) => (
                          <button
                            key={id}
                            type="button"
                            title={label}
                            aria-label={`${label}: ${food.name}`}
                            aria-pressed={selected === id}
                            onClick={() => setPending({ foodKey, foodName: food.name, value: id })}
                            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                              selected === id
                                ? "bg-accent text-white"
                                : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                            }`}
                          >
                            <Icon size={15} />
                          </button>
                        ))}
                        {selected && (
                          <span className="ml-1 text-xs font-medium text-accent sm:hidden">
                            {FOOD_FEEDBACK.find((item) => item.id === selected)?.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      <TimePickerDialog
        open={editingTime !== null}
        title={`Horário: ${editingTime?.title ?? ""}`}
        value={editingTime?.time ?? "00:00"}
        onConfirm={(value) => {
          if (editingTime) {
            saveMealTime(editingTime.id, value);
            // O filtro ativo segue a refeição para o novo horário.
            if (time === editingTime.time) setTime(value);
          }
          setEditingTime(null);
        }}
        onCancel={() => setEditingTime(null)}
      />

      <ConfirmDialog
        open={pending !== null}
        title={pendingIsRemoval ? "Remover marcação?" : `Marcar como "${pendingLabel}"?`}
        description={
          pendingIsRemoval
            ? `"${pending?.foodName}" deixará de estar marcado como "${pendingLabel}".`
            : `"${pending?.foodName}" será marcado como "${pendingLabel}" no seu plano alimentar.`
        }
        confirmLabel={pendingIsRemoval ? "Remover" : "Confirmar"}
        onConfirm={confirmFeedback}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
