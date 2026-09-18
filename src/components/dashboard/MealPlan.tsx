"use client";

import { useState } from "react";
import Image from "next/image";
import { Flame, Wheat, Drumstick, Droplet, SlidersHorizontal, ChevronDown } from "lucide-react";
import { mealCategories, mealPlan } from "@/lib/mock-data";

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
  const [category, setCategory] = useState<(typeof mealCategories)[number]>("Todos");

  const meals = mealPlan.filter(
    (meal) => category === "Todos" || meal.category === category
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-neutral-900">Plano Alimentar</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600"
          >
            <SlidersHorizontal size={14} /> Filtrar <ChevronDown size={14} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600"
          >
            Ordenar por: Calorias <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {mealCategories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === item
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Image
                  src={meal.image}
                  alt={meal.title}
                  width={96}
                  height={96}
                  className="h-24 w-24 shrink-0 rounded-xl object-cover"
                />

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-600">
                      {meal.category}
                    </span>
                    <span className="flex flex-wrap items-center gap-3 text-neutral-500">
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
                    </span>
                  </div>

                  <p className="mt-2 font-semibold text-neutral-900">{meal.title}</p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <div className="grid min-w-[520px] grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-2 border-b border-neutral-100 pb-2 text-xs font-medium text-neutral-400">
                  <span>Alimento</span>
                  <span>Quantidade</span>
                  <span>Carb.</span>
                  <span>Prot.</span>
                  <span>Gord.</span>
                  <span>Kcal</span>
                </div>
                {meal.foods.map((food) => (
                  <div
                    key={food.name}
                    className="grid min-w-[520px] grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-2 border-b border-neutral-50 py-2 text-sm text-neutral-700 last:border-b-0"
                  >
                    <span>{food.name}</span>
                    <span className="text-neutral-500">{food.quantity}</span>
                    <span>{food.carbs}g</span>
                    <span>{food.protein}g</span>
                    <span>{food.fat}g</span>
                    <span>{food.kcal}</span>
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
