// Alterações do plano, dos alimentos e dos pesos. O backend aplica as regras e devolve o
// resultado já calculado; o front só atualiza o cache. Cada função devolve `null` se falhou.
import { mutate } from "@/lib/api/query";
import type { RemoveMealOption, RestrictedFood, TodayPlan, WeightEntry } from "@/lib/api/types";
import type { FoodFeedback } from "@/lib/food-feedback";
import { ME_PATH } from "@/lib/auth";

export const TODAY_PLAN_PATH = "/plan/today";
export const RESTRICTED_FOODS_PATH = "/foods/restricted";
export const WEIGHTS_PATH = "/weights";

/**
 * Toda mudança no plano: o plano de hoje vem na resposta; as prévias por refeição, o consumo de hoje
 * (`/nutrition/today`, card "Meta diária") e o histórico (que inclui hoje) ficam velhos.
 */
function planMutation(path: string, method: string, body?: unknown, alsoInvalidate: string[] = []) {
  return mutate<TodayPlan>(path, method, body, {
    update: TODAY_PLAN_PATH,
    invalidate: ["/plan/meals/", "/nutrition", "/history", ...alsoInvalidate],
  });
}

export function changeMealTime(mealId: number, time: string) {
  return planMutation(`/plan/meals/${mealId}/time`, "PUT", { time });
}

export function removeMeal(mealId: number, option: RemoveMealOption) {
  return planMutation(`/plan/meals/${mealId}/removal`, "POST", { option });
}

export function createMeal(title: string, time: string) {
  return planMutation("/plan/meals", "POST", { title, time });
}

export function addFood(mealId: number, foodName: string) {
  return planMutation(`/plan/meals/${mealId}/foods`, "POST", { foodName });
}

export function removeExtraFood(mealId: number, extraId: string) {
  return planMutation(`/plan/meals/${mealId}/foods/${encodeURIComponent(extraId)}`, "DELETE");
}

/** "Substituir alimento": `substitute` `null` = sai sem substituto. */
export function swapFood(mealId: number, foodName: string, reason: FoodFeedback, substitute: string | null) {
  return planMutation(`/plan/meals/${mealId}/swaps`, "POST", { foodName, reason, substitute }, [RESTRICTED_FOODS_PATH]);
}

/** "Liberar" na página Alimentos: tira a restrição, as trocas já feitas continuam. */
export function releaseFood(foodName: string) {
  return mutate<RestrictedFood[]>(`${RESTRICTED_FOODS_PATH}/${encodeURIComponent(foodName)}`, "DELETE", undefined, {
    update: RESTRICTED_FOODS_PATH,
    invalidate: ["/plan/meals/"],
  });
}

export function addWeightEntry(kg: number, at: Date) {
  // O aviso de pesagem (`weighInDue`) vem de /me.
  return mutate<WeightEntry[]>(WEIGHTS_PATH, "POST", { kg, at: at.toISOString() }, {
    update: WEIGHTS_PATH,
    invalidate: [ME_PATH],
  });
}
