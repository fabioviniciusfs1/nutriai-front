// Sessão e dados do usuário, guardados no backend. O token fica no localStorage; o estado do
// usuário (`GET /me`) fica em memória e é substituído pela resposta de cada alteração.
import { useSyncExternalStore } from "react";
import { ApiError, apiFetch, getToken, onTokenChange, setToken } from "@/lib/api/client";
import type { AuthResponse, DayPlanChanges, PlanChanges, UserState, WeightEntry } from "@/lib/api/types";
import type { Profile } from "@/lib/calorie-target";
import type { FoodFeedback } from "@/lib/food-feedback";

export type { DayPlanChanges, PlanChanges, WeightEntry };

export const EMPTY_PLAN_CHANGES: PlanChanges = {
  removed: [],
  added: [],
  extraFoods: {},
  scales: {},
};

export const EMPTY_DAY_PLAN: DayPlanChanges = {
  removed: [],
  replacements: {},
  scales: {},
};

/** Data local "AAAA-MM-DD": as mudanças do plano valem só para o dia em que foram feitas. */
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export type AuthState = {
  user: { name: string; username: string } | null;
  profile: Profile | null;
  mealTimes: Record<number, string>;
  /** Ordenados do mais antigo para o mais recente. */
  weights: WeightEntry[];
  planChanges: PlanChanges;
  /** Mudanças do plano de hoje (vazio se não houver ou se forem de outro dia). */
  dayPlan: DayPlanChanges;
  foodFeedback: Record<string, FoodFeedback>;
  foodSubstitutes: Record<string, string>;
  mealFoodSwaps: Record<number, Record<string, string>>;
};

type Result = { ok: true } | { ok: false; error: string };

const listeners = new Set<() => void>();

/** Último `GET /me` (ou resposta de uma alteração); `null` enquanto não carregou. */
let userState: UserState | null = null;
let loadingUser = false;
/** Falha ao carregar a sessão (ex.: backend fora do ar); a tela mostra "tentar novamente". */
let sessionError: string | null = null;
/** Falha na última alteração; aparece como aviso até ser dispensada. */
let mutationError: string | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

async function loadUser() {
  if (loadingUser || !getToken()) return;
  loadingUser = true;
  sessionError = null;
  notify();
  try {
    userState = await apiFetch<UserState>("/me");
  } catch (error) {
    // Um 401 já encerrou a sessão em `apiFetch`; os outros erros deixam tentar de novo.
    if (getToken()) sessionError = error instanceof ApiError ? error.message : "Erro inesperado.";
  } finally {
    loadingUser = false;
    notify();
  }
}

export function retrySession() {
  void loadUser();
}

function handleTokenChange() {
  userState = null;
  sessionError = null;
  notify();
  void loadUser();
}

onTokenChange(handleTokenChange);

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export async function signUp(name: string, rawUsername: string, password: string): Promise<Result> {
  const username = normalizeUsername(rawUsername);
  if (name.trim().length < 2) return { ok: false, error: "Informe seu nome." };
  if (!/^[a-z0-9._]{3,20}$/.test(username)) {
    return { ok: false, error: "O usuário deve ter de 3 a 20 caracteres: letras, números, ponto ou sublinhado." };
  }
  if (password.length < 6) return { ok: false, error: "A senha deve ter pelo menos 6 caracteres." };

  return authenticate("/auth/signup", { name: name.trim(), username, password });
}

export async function signIn(rawUsername: string, password: string): Promise<Result> {
  return authenticate("/auth/login", { username: normalizeUsername(rawUsername), password });
}

async function authenticate(path: string, body: unknown): Promise<Result> {
  try {
    const { token } = await apiFetch<AuthResponse>(path, { method: "POST", body });
    setToken(token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? error.message : "Erro inesperado." };
  }
}

export function signOut() {
  setToken(null);
}

/** Envia uma alteração; a resposta é o estado completo do usuário. `false` se falhou. */
async function mutate(path: string, method: string, body?: unknown) {
  try {
    userState = await apiFetch<UserState>(path, { method, body });
    mutationError = null;
    notify();
    return true;
  } catch (error) {
    mutationError = error instanceof ApiError ? error.message : "Erro inesperado.";
    notify();
    return false;
  }
}

export function saveProfile(profile: Profile) {
  return mutate("/me/profile", "PUT", profile);
}

export function saveMealTime(mealId: number, time: string) {
  return mutate(`/me/meal-times/${mealId}`, "PUT", { time });
}

export function addWeightEntry(kg: number, at: Date) {
  return mutate("/me/weights", "POST", { kg, at: at.toISOString() });
}

export function saveDayPlanChanges(changes: DayPlanChanges) {
  return mutate("/me/day-plan", "PUT", { date: today(), changes });
}

export function savePlanChanges(changes: PlanChanges) {
  return mutate("/me/plan-changes", "PUT", changes);
}

/**
 * "Não gosto" / "Não tenho": o alimento é trocado por `substitute` em todas as refeições, de forma
 * permanente (`null` = sai sem substituto), e fica restrito para o assistente.
 */
export function markFoodEverywhere(foodName: string, value: FoodFeedback, substitute: string | null) {
  return mutate("/me/food-swaps", "POST", { foodName, reason: value, substitute, mealId: null });
}

/**
 * "Não quero": troca o alimento só na refeição `mealId`, de forma permanente (as outras refeições
 * continuam com ele). O alimento fica restrito para o assistente, sem sobrescrever uma marcação
 * "Não gosto"/"Não tenho" que já exista.
 */
export function markFoodInMeal(mealId: number, foodName: string, substitute: string | null) {
  return mutate("/me/food-swaps", "POST", { foodName, reason: "nao-quero", substitute, mealId });
}

/** Libera o alimento para o assistente voltar a recomendá-lo. Trocas já feitas continuam. */
export function releaseFood(foodName: string) {
  return mutate(`/me/food-feedback/${encodeURIComponent(foodName)}`, "DELETE");
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Login/logout em outra aba muda o token no localStorage.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === "nutriai:token") handleTokenChange();
  };
  window.addEventListener("storage", onStorage);
  if (!userState && !sessionError) void loadUser();
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const SIGNED_OUT: AuthState = {
  user: null,
  profile: null,
  mealTimes: {},
  weights: [],
  planChanges: EMPTY_PLAN_CHANGES,
  dayPlan: EMPTY_DAY_PLAN,
  foodFeedback: {},
  foodSubstitutes: {},
  mealFoodSwaps: {},
};

let cachedFrom: UserState | null = null;
let cachedDate = "";
let cachedState: AuthState = SIGNED_OUT;

function getSnapshot(): AuthState | undefined {
  if (!getToken()) return SIGNED_OUT;
  if (!userState) return undefined;
  // A data entra no cache para o plano voltar ao base quando o dia vira.
  const date = today();
  if (userState === cachedFrom && date === cachedDate) return cachedState;

  const user = userState;
  cachedFrom = user;
  cachedDate = date;
  cachedState = {
    user: user.user,
    profile: user.profile,
    mealTimes: user.mealTimes ?? {},
    weights: [...(user.weights ?? [])].sort((a, b) => a.at.localeCompare(b.at)),
    planChanges: { ...EMPTY_PLAN_CHANGES, ...user.planChanges },
    dayPlan: user.dayPlan?.date === date ? { ...EMPTY_DAY_PLAN, ...user.dayPlan.changes } : EMPTY_DAY_PLAN,
    foodFeedback: user.foodFeedback ?? {},
    foodSubstitutes: user.foodSubstitutes ?? {},
    mealFoodSwaps: user.mealFoodSwaps ?? {},
  };
  return cachedState;
}

/** `undefined` enquanto a sessão não foi carregada (render no servidor, hidratação e `GET /me`). */
export function useAuth(): AuthState | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}

/** Erro ao carregar a sessão (tente de novo com `retrySession`). */
export function useSessionError() {
  return useSyncExternalStore(
    subscribe,
    () => sessionError,
    () => null
  );
}

/** Erro da última alteração enviada ao backend. */
export function useMutationError() {
  return useSyncExternalStore(
    subscribe,
    () => mutationError,
    () => null
  );
}

export function dismissMutationError() {
  mutationError = null;
  notify();
}
