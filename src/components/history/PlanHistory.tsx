import { Check, ChevronDown, X } from "lucide-react";
import { planHistory } from "@/lib/mock-data";
import { FOOD_FEEDBACK } from "@/lib/food-feedback";
import { formatLongDate, numberFormat } from "@/components/history/format";

export function PlanHistory() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">Planos Anteriores</h3>
      <p className="mt-1 text-xs text-neutral-500">Toque em um dia para ver as refeições</p>

      <ul className="mt-4 flex flex-col gap-3">
        {planHistory.map((plan) => {
          const followed = plan.meals.filter((meal) => meal.followed).length;
          const plannedKcal = plan.meals.reduce((total, meal) => total + meal.kcal, 0);

          return (
            <li key={plan.date}>
              <details className="group rounded-xl border border-neutral-100">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                    <span className="font-medium text-neutral-900">{formatLongDate(plan.date)}</span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-neutral-500">
                      <span>
                        {followed}/{plan.meals.length} refeições seguidas
                      </span>
                      <span>{numberFormat.format(plannedKcal)} kcal planejadas</span>
                      {plan.flaggedFoods.length > 0 && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
                          {plan.flaggedFoods.length} {plan.flaggedFoods.length === 1 ? "alimento marcado" : "alimentos marcados"}
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronDown size={16} className="shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
                </summary>

                <div className="border-t border-neutral-100 px-4 pb-4">
                  <ul className="flex flex-col">
                    {plan.meals.map((meal) => (
                      <li
                        key={meal.category}
                        className="flex items-center gap-3 border-b border-neutral-50 py-2.5 text-sm last:border-b-0"
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            meal.followed ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"
                          }`}
                          aria-label={meal.followed ? "Refeição seguida" : "Refeição não seguida"}
                        >
                          {meal.followed ? <Check size={14} /> : <X size={14} />}
                        </span>
                        <span className="flex flex-1 flex-col sm:flex-row sm:items-center sm:gap-3">
                          <span className="text-xs text-neutral-400 sm:w-28">{meal.category}</span>
                          <span className={meal.followed ? "text-neutral-800" : "text-neutral-400 line-through"}>
                            {meal.title}
                          </span>
                        </span>
                        <span className="text-neutral-500">{meal.kcal} kcal</span>
                      </li>
                    ))}
                  </ul>

                  {plan.flaggedFoods.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plan.flaggedFoods.map((food) => {
                        const option = FOOD_FEEDBACK.find((item) => item.id === food.feedback)!;
                        return (
                          <span
                            key={food.name}
                            className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600"
                          >
                            <option.Icon size={13} className="text-accent" />
                            <span className="font-medium text-neutral-800">{food.name}</span>· {option.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
