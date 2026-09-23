"use client";

import { useState } from "react";
import { Clock, Flame, Wheat, Drumstick, Droplet, Plus, Trash2 } from "lucide-react";
import { mealAlternatives, mealPeriod, mealPlan } from "@/lib/mock-data";
import { FOOD_FEEDBACK, type FoodFeedback } from "@/lib/food-feedback";
import { FoodFeedbackDialog } from "@/components/dashboard/FoodFeedbackDialog";
import { resolveFoods, substituteOptions, usesRestrictedFood } from "@/lib/food-substitution";
import { TimePickerDialog } from "@/components/dashboard/TimePickerDialog";
import { RemoveMealDialog, type RemoveMealOption } from "@/components/dashboard/RemoveMealDialog";
import { CreateMealDialog, type CreateMealPreview } from "@/components/dashboard/CreateMealDialog";
import {
  EMPTY_DAY_PLAN,
  markFoodEverywhere,
  markFoodInMeal,
  saveDayPlanChanges,
  saveMealTime,
  useAuth,
} from "@/lib/auth";

type Totals = { carbs: number; protein: number; fat: number; kcal: number };

function sumTotals(foods: Totals[]) {
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

/** Porção dos alimentos multiplicada por `factor` (gramas e nutrientes juntos). */
function scaleFoods<T extends Totals & { grams: number }>(foods: T[], factor: number): T[] {
  if (factor === 1) return foods;
  return foods.map((food) => ({
    ...food,
    grams: Math.max(1, Math.round(food.grams * factor)),
    carbs: Math.round(food.carbs * factor),
    protein: Math.round(food.protein * factor),
    fat: Math.round(food.fat * factor),
    kcal: Math.round(food.kcal * factor),
  }));
}

/** Uma refeição do plano de hoje, com o que é preciso para recalcular a porção dela. */
type ScalableMeal = { id: number; totalsAt: (scale: number) => Totals };

/**
 * Multiplica as porções de `meals` por `factor` e, se os valores arredondados como o card mostra
 * passarem de `limitKcal`, aperta o fator até caber. Garante que o dia nunca passe do total anterior.
 */
function fitFactor(meals: ScalableMeal[], scales: Record<number, number>, factor: number, limitKcal: number) {
  const kcalAt = (f: number) => meals.reduce((sum, meal) => sum + meal.totalsAt((scales[meal.id] ?? 1) * f).kcal, 0);
  let fitted = factor;
  for (let i = 0; i < 20 && kcalAt(fitted) > limitKcal; i++) fitted *= 0.995;
  return fitted;
}

export function MealPlan() {
  const [time, setTime] = useState("Todos");
  const auth = useAuth();
  const savedTimes = auth?.mealTimes;
  // Marcações valem por alimento e até o usuário mudar; remoções/trocas valem só para o dia de hoje.
  const feedback = auth?.foodFeedback ?? {};
  const substitutes = auth?.foodSubstitutes ?? {};
  const dayPlan = auth?.dayPlan ?? EMPTY_DAY_PLAN;
  const { removed, replacements, scales, added } = dayPlan;
  const mealFoodSwaps = auth?.mealFoodSwaps ?? {};
  const [editingTime, setEditingTime] = useState<{ id: number; title: string; time: string } | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const [pending, setPending] = useState<{
    mealId: number;
    mealTitle: string;
    foodName: string;
    kcal: number;
    value: FoodFeedback;
  } | null>(null);

  function confirmFeedback(substitute: string | null) {
    if (!pending) return;
    // "Não quero" troca só nesta refeição; "Não gosto" e "Não tenho", em todas. As duas são permanentes.
    if (pending.value === "nao-quero") markFoodInMeal(pending.mealId, pending.foodName, substitute);
    else markFoodEverywhere(pending.foodName, pending.value, substitute);
    setPending(null);
  }

  const pendingLabel = FOOD_FEEDBACK.find((item) => item.id === pending?.value)?.label ?? "";
  const pendingOptions = pending ? substituteOptions(pending.foodName, pending.kcal, feedback) : [];

  const baseMeals = [
    ...mealPlan.map((meal) => ({ ...meal, time: savedTimes?.[meal.id] ?? meal.time, custom: false, suggestion: "" })),
    ...added.map((meal) => ({ ...meal, custom: true })),
  ];

  const plan = baseMeals
    .filter((meal) => !removed.includes(meal.id))
    .map((meal) => {
      const replacement = replacements[meal.id];
      const scale = scales[meal.id] ?? 1;
      // Alimentos marcados como "Não gosto / Não quero / Não tenho" já entram trocados pelo substituto.
      const baseFoods = resolveFoods(replacement?.foods ?? meal.foods, { ...substitutes, ...mealFoodSwaps[meal.id] });
      // Porções ajustadas no dia: menores quando uma refeição nova abriu espaço, maiores quando
      // receberam os nutrientes de uma refeição removida.
      const foods = scaleFoods(baseFoods, scale);
      return {
        ...meal,
        ...replacement,
        foods,
        totals: sumTotals(foods),
        /** Totais se a porção desta refeição passar a ser `nextScale` (usado nos avisos). */
        totalsAt: (nextScale: number) => sumTotals(scaleFoods(baseFoods, nextScale)),
      };
    })
    .sort((a, b) => a.time.localeCompare(b.time));
  const mealTimes = ["Todos", ...new Set(plan.map((meal) => meal.time))];
  // Se a refeição do filtro ativo foi removida, volta para "Todos".
  const activeTime = mealTimes.includes(time) ? time : "Todos";
  const meals = plan.filter((meal) => activeTime === "Todos" || meal.time === activeTime);

  const removingMeal = plan.find((meal) => meal.id === removing);
  const nextMeals = removingMeal ? plan.filter((meal) => meal.time > removingMeal.time) : [];
  const usedTitles = new Set([
    ...mealPlan.map((meal) => meal.title),
    ...Object.values(replacements).map((meal) => meal.title),
    ...added.map((meal) => meal.suggestion),
  ]);
  // O assistente evita sugerir refeições com alimentos restritos (enquanto não forem liberados).
  const byRestriction = (a: (typeof mealAlternatives)[number], b: (typeof mealAlternatives)[number]) =>
    Number(usesRestrictedFood(a.foods, feedback)) - Number(usesRestrictedFood(b.foods, feedback));
  const availableAlternatives = mealAlternatives.filter((meal) => !usedTitles.has(meal.title)).sort(byRestriction);

  /**
   * Planeja uma refeição nova sem mudar o total de calorias do dia (e sem passar da meta): ela fica
   * com no máximo a "parte justa" do dia (total ÷ nº de refeições) e todas as outras têm as porções
   * reduzidas na mesma proporção para abrir espaço. É o que o aviso de confirmação mostra.
   */
  function planNewMeal(title: string, mealTime: string) {
    // Prefere uma sugestão do mesmo período do dia que ainda não está no plano; se acabarem, repete.
    // (Com o backend, quem escolhe os alimentos é o assistente de IA, como no plano base.)
    const period = mealPeriod(mealTime);
    const inPeriod = (meal: (typeof mealAlternatives)[number]) => meal.periods.includes(period);
    const suggestion =
      availableAlternatives.find(inPeriod) ??
      [...mealAlternatives].sort(byRestriction).find(inPeriod) ??
      mealAlternatives[0];

    const dayKcal = sumTotals(plan.map((meal) => meal.totals)).kcal;
    const suggestedKcal = sumTotals(suggestion.foods).kcal;
    // Com o plano do dia vazio não há de onde tirar: a sugestão entra com a porção original.
    const portion = dayKcal === 0 ? 1 : Math.min(1, dayKcal / (plan.length + 1) / suggestedKcal);
    const foods = scaleFoods(suggestion.foods, portion);
    const totals = sumTotals(foods);
    const othersFactor =
      dayKcal === 0 ? 1 : fitFactor(plan, scales, (dayKcal - totals.kcal) / dayKcal, dayKcal - totals.kcal);

    return { title, time: mealTime, suggestion: suggestion.title, foods, totals, othersFactor };
  }

  function previewNewMeal(title: string, mealTime: string): CreateMealPreview {
    const { totals, othersFactor } = planNewMeal(title, mealTime);
    return {
      totals,
      reductionPercent: Math.round((1 - othersFactor) * 100),
      sources: plan.map((meal) => ({
        title: meal.title,
        time: meal.time,
        before: meal.totals.kcal,
        after: meal.totalsAt((scales[meal.id] ?? 1) * othersFactor).kcal,
      })),
    };
  }

  function createMeal(title: string, mealTime: string) {
    const { suggestion, foods, othersFactor } = planNewMeal(title, mealTime);
    const id = Math.max(1000, ...added.map((meal) => meal.id)) + 1;
    const nextScales = { ...scales };
    for (const meal of plan) nextScales[meal.id] = (scales[meal.id] ?? 1) * othersFactor;

    saveDayPlanChanges({
      ...dayPlan,
      scales: nextScales,
      added: [...added, { id, title, time: mealTime, suggestion, foods }],
    });
    setTime("Todos");
    setCreating(false);
  }

  function changeMealTime(id: number, value: string) {
    // Refeições criadas guardam o horário nas mudanças do dia; as do plano base, nos horários do usuário.
    if (added.some((meal) => meal.id === id)) {
      saveDayPlanChanges({
        ...dayPlan,
        added: added.map((meal) => (meal.id === id ? { ...meal, time: value } : meal)),
      });
    } else {
      saveMealTime(id, value);
    }
  }

  /**
   * "Redistribuir": as refeições seguintes aumentam as porções na mesma proporção para receber as
   * calorias da removida, sem passar do total que o dia tinha.
   */
  function planRedistribution() {
    if (!removingMeal || nextMeals.length === 0) return { factor: 1, preview: [] };
    const nextKcal = nextMeals.reduce((sum, meal) => sum + meal.totals.kcal, 0);
    const limit = nextKcal + removingMeal.totals.kcal;
    const factor = nextKcal === 0 ? 1 : fitFactor(nextMeals, scales, limit / nextKcal, limit);
    return {
      factor,
      preview: nextMeals.map((meal) => ({
        title: meal.title,
        time: meal.time,
        before: meal.totals.kcal,
        after: meal.totalsAt((scales[meal.id] ?? 1) * factor).kcal,
      })),
    };
  }
  const redistribution = planRedistribution();

  function confirmRemoval(option: RemoveMealOption) {
    if (!removingMeal) return;
    const id = removingMeal.id;

    if (option === "suggest") {
      // Compara com a porção original: a sugestão herda o ajuste de porção desta refeição.
      const target = removingMeal.totalsAt(1).kcal;
      const [alternative] = [...availableAlternatives].sort(
        (a, b) =>
          byRestriction(a, b) ||
          Math.abs(sumTotals(a.foods).kcal - target) - Math.abs(sumTotals(b.foods).kcal - target)
      );
      if (alternative) {
        saveDayPlanChanges({ ...dayPlan, replacements: { ...replacements, [id]: alternative } });
      }
    } else {
      const nextScales = { ...scales };
      if (option === "redistribute") {
        for (const meal of nextMeals) nextScales[meal.id] = (scales[meal.id] ?? 1) * redistribution.factor;
      }
      saveDayPlanChanges({ ...dayPlan, removed: [...removed, id], scales: nextScales });
    }
    setRemoving(null);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-neutral-900">Plano Alimentar</h3>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          <Plus size={16} /> Nova refeição
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {mealTimes.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTime(item)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTime === item
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
          const { totals } = meal;

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
                <button
                  type="button"
                  title="Remover refeição"
                  aria-label={`Remover refeição: ${meal.title}`}
                  onClick={() => setRemoving(meal.id)}
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
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
                {meal.foods.map((food, index) => {
                  return (
                    <div
                      // Com substituições, o mesmo alimento pode aparecer duas vezes na refeição.
                      key={`${index}-${food.name}`}
                      className="grid grid-cols-4 gap-x-2 gap-y-2 border-b border-neutral-100 py-3 text-sm text-neutral-700 last:border-b-0 sm:grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr_auto] sm:border-neutral-50 sm:py-2"
                    >
                      <span className="col-span-3 font-medium text-neutral-900 sm:col-span-1 sm:font-normal sm:text-neutral-700">
                        {food.name}
                      </span>
                      <span className="text-right text-neutral-500 sm:text-left">{food.grams} g</span>
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
                            onClick={() =>
                              setPending({ mealId: meal.id, mealTitle: meal.title, foodName: food.name, kcal: food.kcal, value: id })
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                          >
                            <Icon size={15} />
                          </button>
                        ))}
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
            changeMealTime(editingTime.id, value);
            // O filtro ativo segue a refeição para o novo horário.
            if (time === editingTime.time) setTime(value);
          }
          setEditingTime(null);
        }}
        onCancel={() => setEditingTime(null)}
      />

      <CreateMealDialog
        open={creating}
        preview={previewNewMeal}
        onConfirm={createMeal}
        onCancel={() => setCreating(false)}
      />

      <RemoveMealDialog
        open={removingMeal !== undefined}
        mealTitle={removingMeal?.title ?? ""}
        mealKcal={removingMeal?.totals.kcal ?? 0}
        redistribution={redistribution.preview}
        canSuggest={availableAlternatives.length > 0}
        onConfirm={confirmRemoval}
        onCancel={() => setRemoving(null)}
      />

      <FoodFeedbackDialog
        open={pending !== null}
        foodName={pending?.foodName ?? ""}
        feedbackLabel={pendingLabel}
        onlyThisMeal={pending?.value === "nao-quero" ? pending.mealTitle : null}
        options={pendingOptions}
        onConfirm={confirmFeedback}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
