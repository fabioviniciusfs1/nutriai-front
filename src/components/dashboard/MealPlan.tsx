"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Clock, Flame, Wheat, Drumstick, Droplet, PlusCircle, Trash2 } from "lucide-react";
import type { FoodFeedback } from "@/lib/food-feedback";
import type { TodayPlan } from "@/lib/api/types";
import { mealSlotLabel, type MealSlot } from "@/lib/profile";
import { invalidate, useApiQuery } from "@/lib/api/query";
import {
  addFood,
  changeMealTime,
  checkMealTime,
  personalizePlan,
  removeExtraFood,
  swapFood,
  TODAY_PLAN_PATH,
} from "@/lib/api/actions";
import { QueryStatus, Spinner } from "@/components/api/QueryStatus";
import { FoodFeedbackDialog } from "@/components/dashboard/FoodFeedbackDialog";
import { MealTimeAdviceDialog } from "@/components/dashboard/MealTimeAdviceDialog";
import { TimePickerDialog } from "@/components/dashboard/TimePickerDialog";
import { AddFoodDialog } from "@/components/dashboard/AddFoodDialog";

/**
 * Plano de hoje, já calculado pelo backend (trocas, porções, alimentos acrescentados). Cada
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
          O assistente está escolhendo as refeições a partir do seu perfil e da sua rotina. Isso leva alguns segundos.
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

/** Refeição cujo horário está sendo mudado. */
type EditingTime = { id: number; slot: MealSlot; title: string; time: string };

function MealPlanView({ plan }: { plan: TodayPlan }) {
  const [time, setTime] = useState("Todos");
  const [editingTime, setEditingTime] = useState<EditingTime | null>(null);
  // Conferindo o novo horário com o assistente antes de salvar.
  const [checkingTime, setCheckingTime] = useState(false);
  // Aviso do assistente sobre o horário escolhido (`time`): o usuário mantém ou muda para o sugerido.
  const [timeAdvice, setTimeAdvice] = useState<
    (EditingTime & { chosen: string; message: string; suggestedTime: string | null; canKeep: boolean }) | null
  >(null);
  const [addingFoodTo, setAddingFoodTo] = useState<number | null>(null);
  const [pending, setPending] = useState<{ mealId: number; mealTitle: string; foodName: string } | null>(null);

  const mealTimes = ["Todos", ...new Set(plan.meals.map((meal) => meal.time))];
  // Se nenhuma refeição tem mais o horário do filtro ativo, volta para "Todos".
  const activeTime = mealTimes.includes(time) ? time : "Todos";
  const meals = plan.meals.filter((meal) => activeTime === "Todos" || meal.time === activeTime);

  const addingFoodMeal = plan.meals.find((meal) => meal.id === addingFoodTo);

  // Os diálogos só fecham se o backend aceitou; se falhar, o aviso de erro aparece e dá para tentar de novo.
  async function confirmFeedback(reason: FoodFeedback, substitute: string | null) {
    if (pending && (await swapFood(pending.mealId, pending.foodName, reason, substitute))) setPending(null);
  }

  async function confirmAddFood(foodName: string, grams: number) {
    if (addingFoodTo !== null && (await addFood(addingFoodTo, foodName, grams))) setAddingFoodTo(null);
  }

  async function saveTime(meal: EditingTime, value: string) {
    const saved = await changeMealTime(meal.id, value);
    // O filtro ativo segue a refeição para o novo horário.
    if (saved && time === meal.time) setTime(value);
    return saved !== null;
  }

  async function confirmTime(value: string) {
    if (!editingTime) return;
    setCheckingTime(true);
    // Se a conferência falhar (rede), salva direto: ela nunca impede a troca.
    const check = await checkMealTime(editingTime.id, value);
    setCheckingTime(false);
    if (check && !check.ok && check.message) {
      setTimeAdvice({
        ...editingTime,
        chosen: value,
        message: check.message,
        suggestedTime: check.suggestedTime,
        canKeep: check.canKeep,
      });
      setEditingTime(null);
      return;
    }
    if (await saveTime(editingTime, value)) setEditingTime(null);
  }

  async function chooseTime(value: string) {
    if (!timeAdvice) return;
    setCheckingTime(true);
    if (await saveTime(timeAdvice, value)) setTimeAdvice(null);
    setCheckingTime(false);
  }

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
              activeTime === item
                ? "bg-accent text-white"
                : "bg-accent/15 text-accent hover:bg-accent/25"
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
            <li key={meal.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">{mealSlotLabel(meal.slot)}</p>
                  <p className="font-semibold text-neutral-900">{meal.title}</p>
                </div>
                <button
                  type="button"
                  title="Alterar horário da refeição"
                  aria-label={`Horário da refeição: ${meal.title}, ${meal.time}. Alterar`}
                  onClick={() => setEditingTime({ id: meal.id, slot: meal.slot, title: meal.title, time: meal.time })}
                  className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/25"
                >
                  <Clock size={12} /> {meal.time}
                </button>
                {/* Na mesma coluna (e do mesmo tamanho) que o botão de substituir de cada alimento. */}
                <div className="ml-auto flex w-[3.75rem] justify-start">
                  <button
                    type="button"
                    title="Adicionar alimento extra"
                    aria-label={`Adicionar alimento extra: ${meal.title}`}
                    onClick={() => setAddingFoodTo(meal.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25"
                  >
                    <PlusCircle size={15} />
                  </button>
                </div>
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
                <div className="hidden sm:grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr_auto] gap-2 border-b border-neutral-200 pb-2 text-xs font-medium text-neutral-400 sm:grid">
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
                      className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-x-2 gap-y-2 border-b border-neutral-200 py-3 text-sm text-neutral-700 last:border-b-0 sm:grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr_auto] sm:items-center sm:py-2"
                    >
                      <span className="col-span-4 font-medium text-neutral-900 sm:col-span-1 sm:font-normal sm:text-neutral-700">
                        {food.name}
                      </span>
                      <span className="text-right text-neutral-500 sm:text-left">
                        {/* Ovo: `grams` = unidades × peso da unidade. */}
                        {food.units !== undefined ? (
                          <>
                            {food.units} {food.units === 1 ? "ovo" : "ovos"}
                            <span className="block text-xs text-neutral-400">{food.grams / food.units} g/unid.</span>
                          </>
                        ) : (
                          `${food.grams} g`
                        )}
                      </span>
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
                      {/* No celular, os botões ficam à direita dos nutrientes, na mesma linha; a coluna tem largura fixa
                          para o de substituir ficar alinhado em todas as linhas e com o de adicionar alimento. */}
                      <div className="flex w-[3.75rem] items-center gap-1">
                        <button
                          type="button"
                          title="Substituir alimento"
                          aria-label={`Substituir alimento: ${food.name}`}
                          onClick={() =>
                            setPending({ mealId: meal.id, mealTitle: meal.title, foodName: food.name })
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25"
                        >
                          <ArrowLeftRight size={15} />
                        </button>
                        {extraId !== null && (
                          <button
                            type="button"
                            title="Remover alimento"
                            aria-label={`Remover alimento: ${food.name}`}
                            onClick={() => void removeExtraFood(meal.id, extraId)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25"
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
        busy={checkingTime}
        onConfirm={confirmTime}
        onCancel={() => setEditingTime(null)}
      />

      <MealTimeAdviceDialog
        open={timeAdvice !== null}
        title={timeAdvice ? `${mealSlotLabel(timeAdvice.slot)} às ${timeAdvice.chosen}?` : ""}
        message={timeAdvice?.message ?? ""}
        time={timeAdvice?.chosen ?? ""}
        suggestedTime={timeAdvice?.suggestedTime ?? null}
        canKeep={timeAdvice?.canKeep ?? true}
        busy={checkingTime}
        onChoose={chooseTime}
        onCancel={() => setTimeAdvice(null)}
      />

      <AddFoodDialog
        mealId={addingFoodMeal?.id ?? null}
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
