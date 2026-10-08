"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Clock, Flame, Wheat, Drumstick, Droplet, Plus, PlusCircle, Trash2 } from "lucide-react";
import type { FoodFeedback } from "@/lib/food-feedback";
import type { RemoveMealOption, TodayPlan } from "@/lib/api/types";
import { invalidate, useApiQuery } from "@/lib/api/query";
import {
  addFood,
  changeMealTime,
  createMeal,
  personalizePlan,
  removeExtraFood,
  removeMeal,
  swapFood,
  TODAY_PLAN_PATH,
} from "@/lib/api/actions";
import { QueryStatus, Spinner } from "@/components/api/QueryStatus";
import { FoodFeedbackDialog } from "@/components/dashboard/FoodFeedbackDialog";
import { TimePickerDialog } from "@/components/dashboard/TimePickerDialog";
import { RemoveMealDialog } from "@/components/dashboard/RemoveMealDialog";
import { CreateMealDialog } from "@/components/dashboard/CreateMealDialog";
import { AddFoodDialog } from "@/components/dashboard/AddFoodDialog";

/**
 * Plano de hoje, já calculado pelo backend (trocas, porções, refeições criadas/removidas). Cada
 * ação envia um pedido e a resposta é o plano atualizado.
 */
export function MealPlan() {
  const { data: plan, error, reload } = useApiQuery<TodayPlan>(TODAY_PLAN_PATH);
  const personalizing = plan?.personalization === "pending";

  // Enquanto o assistente monta o plano individual, pergunta de novo a cada poucos segundos (o consumo de
  // hoje acompanha o plano).
  useEffect(() => {
    if (!personalizing) return;
    const timer = setInterval(() => invalidate(TODAY_PLAN_PATH, "/nutrition"), PERSONALIZATION_POLL_MS);
    return () => clearInterval(timer);
  }, [personalizing]);

  if (!plan) return <QueryStatus title="Plano Alimentar" error={error} onRetry={reload} />;
  if (personalizing) return <PersonalizingCard />;
  return <MealPlanView plan={plan} />;
}

const PERSONALIZATION_POLL_MS = 3000;

/** No lugar do plano enquanto o assistente monta o plano individual. */
function PersonalizingCard() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">Plano Alimentar</h3>
      <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
        <Spinner />
        <p className="font-medium text-neutral-900">Montando seu plano personalizado…</p>
        <p className="max-w-sm text-sm text-neutral-500">
          O assistente está escolhendo as refeições a partir do seu perfil. Isso leva alguns segundos.
        </p>
      </div>
    </div>
  );
}

/** Aviso se a montagem do plano individual falhou (fica o plano padrão). */
function PersonalizationNotice({ personalization }: { personalization: TodayPlan["personalization"] }) {
  const [retrying, setRetrying] = useState(false);
  if (personalization !== "failed") return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
      <p>Não conseguimos montar seu plano personalizado. Este é o plano padrão.</p>
      <button
        type="button"
        disabled={retrying}
        onClick={async () => {
          setRetrying(true);
          await personalizePlan();
          setRetrying(false);
        }}
        className="font-medium underline-offset-2 hover:underline disabled:opacity-50"
      >
        Tentar de novo
      </button>
    </div>
  );
}

function MealPlanView({ plan }: { plan: TodayPlan }) {
  const [time, setTime] = useState("Todos");
  const [editingTime, setEditingTime] = useState<{ id: number; title: string; time: string } | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingFoodTo, setAddingFoodTo] = useState<number | null>(null);
  const [pending, setPending] = useState<{ mealId: number; mealTitle: string; foodName: string } | null>(null);

  const mealTimes = ["Todos", ...new Set(plan.meals.map((meal) => meal.time))];
  // Se a refeição do filtro ativo foi removida, volta para "Todos".
  const activeTime = mealTimes.includes(time) ? time : "Todos";
  const meals = plan.meals.filter((meal) => activeTime === "Todos" || meal.time === activeTime);

  const removingMeal = plan.meals.find((meal) => meal.id === removing);
  const addingFoodMeal = plan.meals.find((meal) => meal.id === addingFoodTo);

  // Os diálogos só fecham se o backend aceitou; se falhar, o aviso de erro aparece e dá para tentar de novo.
  async function confirmFeedback(reason: FoodFeedback, substitute: string | null) {
    if (pending && (await swapFood(pending.mealId, pending.foodName, reason, substitute))) setPending(null);
  }

  async function confirmRemoval(option: RemoveMealOption) {
    if (removing !== null && (await removeMeal(removing, option))) setRemoving(null);
  }

  async function confirmCreate(title: string, mealTime: string) {
    if (await createMeal(title, mealTime)) {
      setTime("Todos");
      setCreating(false);
    }
  }

  async function confirmAddFood(foodName: string) {
    if (addingFoodTo !== null && (await addFood(addingFoodTo, foodName))) setAddingFoodTo(null);
  }

  async function confirmTime(value: string) {
    if (!editingTime) return;
    if (await changeMealTime(editingTime.id, value)) {
      // O filtro ativo segue a refeição para o novo horário.
      if (time === editingTime.time) setTime(value);
      setEditingTime(null);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-neutral-900">Plano Alimentar</h3>
        <button
          type="button"
          onClick={() => setCreating(true)}
          disabled={!plan.canCreateMeal}
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
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

      <PersonalizationNotice personalization={plan.personalization} />

      {plan.meals.length === 0 && (
        <p className="mt-4 text-sm text-neutral-400">Nenhuma refeição no plano de hoje.</p>
      )}

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
                  title="Adicionar alimento"
                  aria-label={`Adicionar alimento: ${meal.title}`}
                  onClick={() => setAddingFoodTo(meal.id)}
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-green-50 hover:text-green-600"
                >
                  <PlusCircle size={16} />
                </button>
                <button
                  type="button"
                  title="Remover refeição"
                  aria-label={`Remover refeição: ${meal.title}`}
                  onClick={() => setRemoving(meal.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
                  <span className="w-[3.75rem]" aria-hidden />
                </div>
                {meal.foods.map((food, index) => {
                  const { extraId } = food;
                  return (
                    <div
                      // Com substituições, o mesmo alimento pode aparecer duas vezes na refeição.
                      key={`${index}-${food.name}`}
                      className="grid grid-cols-4 gap-x-2 gap-y-2 border-b border-neutral-100 py-3 text-sm text-neutral-700 last:border-b-0 sm:grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr_auto] sm:items-center sm:border-neutral-50 sm:py-2"
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
                      <div className="col-span-4 flex items-center gap-1 sm:col-span-1 sm:w-[3.75rem]">
                        <button
                          type="button"
                          title="Substituir alimento"
                          aria-label={`Substituir alimento: ${food.name}`}
                          onClick={() =>
                            setPending({ mealId: meal.id, mealTitle: meal.title, foodName: food.name })
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <ArrowLeftRight size={15} />
                        </button>
                        {extraId !== null && (
                          <button
                            type="button"
                            title="Remover alimento"
                            aria-label={`Remover alimento: ${food.name}`}
                            onClick={() => void removeExtraFood(meal.id, extraId)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
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
        onConfirm={confirmTime}
        onCancel={() => setEditingTime(null)}
      />

      <CreateMealDialog open={creating} onConfirm={confirmCreate} onCancel={() => setCreating(false)} />

      <RemoveMealDialog
        mealId={removingMeal?.id ?? null}
        mealTitle={removingMeal?.title ?? ""}
        mealKcal={removingMeal?.totals.kcal ?? 0}
        onConfirm={confirmRemoval}
        onCancel={() => setRemoving(null)}
      />

      <AddFoodDialog
        mealId={addingFoodMeal?.id ?? null}
        mealTitle={addingFoodMeal?.title ?? ""}
        onConfirm={confirmAddFood}
        onCancel={() => setAddingFoodTo(null)}
      />

      <FoodFeedbackDialog
        mealId={pending?.mealId ?? null}
        foodName={pending?.foodName ?? ""}
        mealTitle={pending?.mealTitle ?? ""}
        onConfirm={confirmFeedback}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
