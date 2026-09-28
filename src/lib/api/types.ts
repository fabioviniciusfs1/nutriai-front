// Contrato com o backend: formatos que as rotas de `docs/api.md` recebem e devolvem.
import type { Profile } from "@/lib/calorie-target";
import type { FoodFeedback } from "@/lib/food-feedback";
import type { FoodGroup } from "@/lib/food-groups";
import type { MealPeriod } from "@/lib/meal-period";

// ---------------------------------------------------------------------------------------------
// Alimentos e plano alimentar

/** Alimento numa porção: quantidade sempre em gramas, nutrientes já calculados para ela. */
export type PlanFood = { name: string; grams: number; carbs: number; protein: number; fat: number; kcal: number };

/** Alimento do catálogo, com nutrientes por 100 g. Todo alimento usado numa refeição precisa estar aqui. */
export type CatalogFood = {
  name: string;
  group: FoodGroup;
  per100g: { carbs: number; protein: number; fat: number; kcal: number };
};

/** Refeição do plano base do usuário. */
export type Meal = {
  id: number;
  title: string;
  /** "HH:MM" */
  time: string;
  foods: PlanFood[];
};

/** Refeição que o assistente pode sugerir (trocar uma refeição removida ou criar uma nova). */
export type MealAlternative = {
  title: string;
  periods: MealPeriod[];
  foods: PlanFood[];
};

// ---------------------------------------------------------------------------------------------
// Nutrientes

export type Nutrient = {
  /** Identificador estável, usado como chave no histórico (ex.: "fibras", "vitamina-c"). */
  id: string;
  name: string;
  /** Consumo de hoje. */
  atual: number;
  meta: number;
  unit: string;
  /** `meta` é um limite máximo (ficar abaixo é o bom), não um alvo a atingir. */
  limit?: boolean;
};

export type MacroId = "proteinas" | "gorduras" | "carboidratos";

/** Consumo de hoje e metas de cada nutriente. Macros em gramas. */
export type NutritionToday = {
  macros: (Nutrient & { id: MacroId })[];
  fibers: Nutrient[];
  /** Açúcares, gordura saturada, colesterol… */
  otherMacros: Nutrient[];
  vitamins: Nutrient[];
  minerals: Nutrient[];
};

// ---------------------------------------------------------------------------------------------
// Histórico

/** Um dia de atividade (Google Fit / Apple Saúde) somado ao consumo registrado. */
export type ActivityDay = {
  /** "AAAA-MM-DD" */
  date: string;
  consumed: number;
  burned: number;
  activeCalories: number;
  steps: number;
  activeMinutes: number;
  distanceKm: number;
  source: string;
};

/** Consumo de um dia por nutriente (id do nutriente → quantidade). */
export type NutrientHistoryDay = { date: string; values: Record<string, number> };

export type PlanHistoryDay = {
  date: string;
  meals: { time: string; title: string; kcal: number; followed: boolean }[];
  flaggedFoods: { name: string; feedback: FoodFeedback }[];
};

export type ActivitySource = {
  name: string;
  platform: string;
  connected: boolean;
  /** ISO 8601, ou `null` se nunca sincronizou. */
  lastSync: string | null;
};

// ---------------------------------------------------------------------------------------------
// Chat

export type ChatMessage = { id: string; role: "assistant" | "user"; text: string };

// ---------------------------------------------------------------------------------------------
// Usuário

/** Peso registrado pelo usuário. Só histórico: não altera `profile.weightKg` nem a meta calórica. */
export type WeightEntry = {
  id: string;
  /** Data/hora da pesagem em ISO 8601. */
  at: string;
  kg: number;
};

/**
 * Mudanças permanentes no plano, até o usuário desfazer: refeições removidas com "não fazer nada",
 * refeições criadas e alimentos acrescentados. Criar/acrescentar tira as calorias das outras
 * refeições (reduzindo as porções), para o total do dia não aumentar.
 */
export type PlanChanges = {
  /** Refeições do plano base removidas com "não fazer nada" (para voltar, só criando outra). */
  removed: number[];
  /** Refeições criadas pelo usuário: nome e horário dele, alimentos sugeridos pelo sistema. */
  added: {
    id: number;
    title: string;
    time: string;
    /** Nome da sugestão de onde vieram os alimentos. */
    suggestion: string;
    foods: PlanFood[];
  }[];
  /**
   * Alimentos acrescentados pelo usuário a cada refeição (id → alimentos), na porção "base" (fator 1):
   * mudam junto com as porções da refeição.
   */
  extraFoods: Record<number, PlanFood[]>;
  /** Fator permanente das porções de cada refeição (id → fator). */
  scales: Record<number, number>;
};

/** Mudanças que valem só no dia em que foram feitas ("sugerir uma nova" e "redistribuir"). */
export type DayPlanChanges = {
  /** Removidas hoje com "redistribuir". */
  removed: number[];
  /** Trocadas hoje por outra sugestão. */
  replacements: Record<number, { title: string; foods: PlanFood[] }>;
  /**
   * Fator das porções só de hoje (id → fator), multiplicado pelo permanente: ao remover com
   * "redistribuir", as refeições seguintes aumentam para receber as calorias.
   */
  scales: Record<number, number>;
};

/** Tudo o que é guardado por usuário. `GET /me` e todas as rotas que alteram `/me` devolvem isto. */
export type UserState = {
  user: { name: string; username: string };
  profile: Profile | null;
  /** Horário escolhido pelo usuário para cada refeição do plano base (id → "HH:MM"). */
  mealTimes: Record<number, string>;
  weights: WeightEntry[];
  planChanges: PlanChanges;
  /** Mudanças do plano de um dia (data local "AAAA-MM-DD"); o front ignora as de outro dia. */
  dayPlan: { date: string; changes: DayPlanChanges } | null;
  /**
   * Alimentos restritos ("Não gosto / Não quero / Não tenho"): o assistente não os recomenda até o
   * usuário liberar na página Alimentos. Liberar não desfaz trocas já feitas.
   */
  foodFeedback: Record<string, FoodFeedback>;
  /**
   * Trocas permanentes de "Não gosto" e "Não tenho" em todas as refeições (nome → substituto;
   * "" = sai sem substituto). Continuam valendo mesmo depois de o alimento ser liberado.
   */
  foodSubstitutes: Record<string, string>;
  /**
   * Trocas permanentes de "Não quero", só na refeição marcada (id da refeição → alimento →
   * substituto; "" = sai sem substituto).
   */
  mealFoodSwaps: Record<number, Record<string, string>>;
};

export type AuthResponse = { token: string };
