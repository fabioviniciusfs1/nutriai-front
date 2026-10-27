// Alterações do plano, dos alimentos e dos pesos. O backend aplica as regras e devolve o
// resultado já calculado; o front só atualiza o cache. Cada função devolve `null` se falhou.
import { mutate } from "@/lib/api/query";
import type {
  CalorieAdjustment,
  CalorieStep,
  DietAdjustment,
  DietEstimateRequest,
  DietPreview,
  DietSettings,
  MealTimeCheck,
  RestrictedFood,
  TodayPlan,
  WeightEntry,
} from "@/lib/api/types";
import type { FoodFeedback } from "@/lib/food-feedback";
import { ME_PATH } from "@/lib/auth";

export const TODAY_PLAN_PATH = "/plan/today";
export const RESTRICTED_FOODS_PATH = "/foods/restricted";
export const WEIGHTS_PATH = "/weights";
export const DIET_PATH = "/me/diet";
export const CALORIES_PATH = "/me/calories";

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

/** O que o assistente acha do novo horário, sem salvar: `ok` = pode salvar direto. */
export function checkMealTime(mealId: number, time: string) {
  return mutate<MealTimeCheck>(`/plan/meals/${mealId}/time-check`, "POST", { time });
}

export function changeMealTime(mealId: number, time: string) {
  return planMutation(`/plan/meals/${mealId}/time`, "PUT", { time });
}

/** Monta de novo o plano individual (depois de uma falha ou de mudar a rotina); a montagem segue em segundo plano. */
export function personalizePlan() {
  return planMutation("/plan/personalize", "POST");
}

/** Alimento extra: `grams` gramas fixas, que somam às calorias do dia. */
export function addFood(mealId: number, foodName: string, grams: number) {
  return planMutation(`/plan/meals/${mealId}/foods`, "POST", { foodName, grams });
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

/** Prévia do ajuste da dieta com a mudança de um macro (e a compensação feita pelo backend), sem salvar. */
export function estimateDiet(request: DietEstimateRequest) {
  return mutate<DietAdjustment>(`${DIET_PATH}/estimate`, "POST", request);
}

/** O plano de hoje com o ajuste, sem salvar ("Ver prévia"). */
export function previewDiet(settings: DietSettings) {
  return mutate<DietPreview>(`${DIET_PATH}/preview`, "POST", settings);
}

/**
 * "+10%" ou "−10%" na meta calórica: a meta (de /me e do ajuste da dieta), as porções do plano e o histórico
 * mudam; a sugestão da central de notificações vem de /me.
 */
export function stepCalories(direction: CalorieStep) {
  return mutate<CalorieAdjustment>(CALORIES_PATH, "POST", { direction }, {
    update: CALORIES_PATH,
    invalidate: [ME_PATH, DIET_PATH, "/plan", "/nutrition", "/history"],
  });
}

/** Salva o ajuste da dieta: as metas, as porções do plano e o histórico mudam. */
export function saveDiet(settings: DietSettings) {
  return mutate<DietAdjustment>(DIET_PATH, "PUT", settings, {
    update: DIET_PATH,
    invalidate: ["/plan", "/nutrition", "/history"],
  });
}
