"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowLeftRight,
  ChartGantt,
  Clock,
  Flame,
  Wheat,
  Drumstick,
  Droplet,
  List,
  PlusCircle,
  Trash2,
} from "lucide-react";
import type { FoodFeedback } from "@/lib/food-feedback";
import type { PlanMeal, TodayPlan } from "@/lib/api/types";
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
import { MealTimeline } from "@/components/dashboard/MealTimeline";
import { daysLabel, selectPlan, useSelectedPlan, withPlan } from "@/lib/plan-selection";

/**
 * Plano de hoje, já calculado pelo backend (trocas, porções, alimentos acrescentados). Cada
 * ação envia um pedido e a resposta é o plano atualizado. Com grupos de dias na rotina, as abas
 * mostram os outros planos (o de hoje vem marcado).
 */
export function MealPlan() {
  const selected = useSelectedPlan();
  const { data: plan, error, reload } = useApiQuery<TodayPlan>(withPlan(TODAY_PLAN_PATH, selected));
  const personalizing = plan?.personalization === "pending";
  const anyPersonalizing = plan?.plans.some((item) => item.personalization === "pending") ?? false;

  // Enquanto o assistente monta algum plano individual, pergunta de novo a cada poucos segundos (o consumo de
  // hoje acompanha o plano).
  useEffect(() => {
    if (!anyPersonalizing) return;
    const timer = setInterval(() => invalidate(TODAY_PLAN_PATH, "/nutrition"), PERSONALIZATION_POLL_MS);
    return () => clearInterval(timer);
  }, [anyPersonalizing]);

  // O plano escolhido pode ter saído da rotina: volta para o de hoje.
  useEffect(() => {
    if (error && selected !== null) selectPlan(null);
  }, [error, selected]);

  if (!plan) return <QueryStatus title="Plano Alimentar" error={error} onRetry={reload} />;
  const tabs = <PlanTabs plan={plan} />;
  if (personalizing) return <PersonalizingCard tabs={tabs} />;
  return <MealPlanView plan={plan} tabs={tabs} />;
}

/** Um plano por grupo de dias da rotina: as abas só aparecem com mais de um. */
function PlanTabs({ plan }: { plan: TodayPlan }) {
  if (plan.plans.length < 2) return null;
  return (
    <div role="tablist" aria-label="Planos" className="mt-3 flex flex-wrap gap-2">
      {plan.plans.map((item) => {
        const open = item.id === plan.plan.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={open}
            onClick={() => selectPlan(item.active ? null : item.id)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
              open
                ? "border-accent bg-accent/5 text-accent"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
            }`}
          >
            {daysLabel(item.days)}
            {item.active && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                Hoje
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const PERSONALIZATION_POLL_MS = 3000;

/** No lugar do plano enquanto o assistente monta o plano individual. */
function PersonalizingCard({ tabs }: { tabs: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">Plano Alimentar</h3>
      {tabs}
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
function PersonalizationNotice({ plan }: { plan: TodayPlan }) {
  const [retrying, setRetrying] = useState(false);
  if (plan.personalization !== "failed") return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
      <p>Não conseguimos montar seu plano personalizado. Este é o plano padrão.</p>
      <button
        type="button"
        disabled={retrying}
        onClick={async () => {
          setRetrying(true);
          await personalizePlan(plan.plan.id);
          setRetrying(false);
        }}
        className="font-medium underline-offset-2 hover:underline disabled:opacity-50"
      >
        Tentar de novo
      </button>
    </div>
  );
}

/** Lista das refeições ou linha do tempo do dia; a escolha fica salva no navegador. */
type PlanView = "lista" | "linha";

const VIEW_KEY = "nutriai.mealPlanView";

const viewListeners = new Set<() => void>();

function useView(): [PlanView, (view: PlanView) => void] {
  const view = useSyncExternalStore(
    (listener) => {
      viewListeners.add(listener);
      return () => viewListeners.delete(listener);
    },
    (): PlanView => (localStorage.getItem(VIEW_KEY) === "linha" ? "linha" : "lista"),
    (): PlanView => "lista"
  );
  return [
    view,
    (next) => {
      localStorage.setItem(VIEW_KEY, next);
      for (const listener of viewListeners) listener();
    },
  ];
}

/** Refeição cujo horário está sendo mudado. */
type EditingTime = { id: number; slot: MealSlot; title: string; time: string };

/** Alimento sendo substituído. */
type PendingSwap = { mealId: number; mealTitle: string; foodName: string };

function MealPlanView({ plan, tabs }: { plan: TodayPlan; tabs: React.ReactNode }) {
  const [view, setView] = useView();
  const [time, setTime] = useState("Todos");
  const [editingTime, setEditingTime] = useState<EditingTime | null>(null);
  // Conferindo o novo horário com o assistente antes de salvar.
  const [checkingTime, setCheckingTime] = useState(false);
  // Aviso do assistente sobre o horário escolhido (`time`): o usuário mantém ou muda para o sugerido.
  const [timeAdvice, setTimeAdvice] = useState<
    (EditingTime & { chosen: string; message: string; suggestedTime: string | null; canKeep: boolean }) | null
  >(null);
  const [addingFoodTo, setAddingFoodTo] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingSwap | null>(null);

  const mealTimes = ["Todos", ...new Set(plan.meals.map((meal) => meal.time))];
  // Se nenhuma refeição tem mais o horário do filtro ativo, volta para "Todos".
  const activeTime = mealTimes.includes(time) ? time : "Todos";
  const meals = plan.meals.filter((meal) => activeTime === "Todos" || meal.time === activeTime);

  const addingFoodMeal = plan.meals.find((meal) => meal.id === addingFoodTo);

  // Os diálogos só fecham se o backend aceitou; se falhar, o aviso de erro aparece e dá para tentar de novo.
  async function confirmFeedback(reason: FoodFeedback, substitute: string) {
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
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-neutral-900">Plano Alimentar</h3>
        <div className="flex gap-1" role="group" aria-label="Visualização">
          {(
            [
              { id: "lista", label: "Lista", icon: List },
              { id: "linha", label: "Linha do tempo", icon: ChartGantt },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              title={label}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                view === id ? "bg-accent text-white" : "bg-accent/15 text-accent hover:bg-accent/25"
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
      {tabs}

      <div className={`mt-4 flex flex-wrap gap-2 ${view === "linha" ? "hidden" : ""}`}>
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

      <PersonalizationNotice plan={plan} />

      {plan.meals.length === 0 && (
        <p className="mt-4 text-sm text-neutral-400">Nenhuma refeição neste plano.</p>
      )}

      {view === "linha" && plan.meals.length > 0 && (
        <MealTimeline
          // Cada plano abre a linha do tempo de novo (centrada e com a refeição escolhida dele).
          key={plan.plan.id}
          meals={plan.meals}
          active={plan.plan.active}
          renderMeal={(meal) => (
            <MealCard
              meal={meal}
              canAddFood={plan.plan.active}
              onEditTime={setEditingTime}
              onAddFood={setAddingFoodTo}
              onSwap={setPending}
            />
          )}
        />
      )}

      <ul className={`mt-4 flex flex-col gap-4 ${view === "linha" ? "hidden" : ""}`}>
        {meals.map((meal) => (
          <li key={meal.id}>
            <MealCard
              meal={meal}
              canAddFood={plan.plan.active}
              onEditTime={setEditingTime}
              onAddFood={setAddingFoodTo}
              onSwap={setPending}
            />
          </li>
        ))}
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

/** Uma refeição do plano: tipo, título, horário, totais e alimentos, com as ações de cada um. */
function MealCard({
  meal,
  canAddFood,
  onEditTime,
  onAddFood,
  onSwap,
}: {
  meal: PlanMeal;
  /** O alimento extra vale só no dia em que entrou: só no plano de hoje. */
  canAddFood: boolean;
  onEditTime: (meal: EditingTime) => void;
  onAddFood: (mealId: number) => void;
  onSwap: (pending: PendingSwap) => void;
}) {
  const { totals } = meal;
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">{mealSlotLabel(meal.slot)}</p>
          <p className="font-semibold text-neutral-900">{meal.title}</p>
        </div>
        <button
          type="button"
          title="Alterar horário da refeição"
          aria-label={`Horário da refeição: ${meal.title}, ${meal.time}. Alterar`}
          onClick={() => onEditTime({ id: meal.id, slot: meal.slot, title: meal.title, time: meal.time })}
          className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/25"
        >
          <Clock size={12} /> {meal.time}
        </button>
        {/* Na mesma coluna (e do mesmo tamanho) que o botão de substituir de cada alimento. O extra vale
            só no dia em que entrou: só no plano de hoje. */}
        <div className="ml-auto flex w-[3.75rem] justify-start">
          {canAddFood && (
            <button
              type="button"
              title="Adicionar alimento extra"
              aria-label={`Adicionar alimento extra: ${meal.title}`}
              onClick={() => onAddFood(meal.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25"
            >
              <PlusCircle size={15} />
            </button>
          )}
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
                  onClick={() => onSwap({ mealId: meal.id, mealTitle: meal.title, foodName: food.name })}
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
    </div>
  );
}
