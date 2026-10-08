// Opções do formulário de perfil. As contas (meta calórica, água) são feitas pelo backend.
export const SEXES = [
  { id: "feminino", label: "Feminino" },
  { id: "masculino", label: "Masculino" },
] as const;

export const ACTIVITY_LEVELS = [
  { id: "sedentario", label: "Sedentário", description: "Pouco ou nenhum exercício" },
  { id: "leve", label: "Levemente ativo", description: "Exercício leve 1 a 3 dias por semana" },
  { id: "moderado", label: "Moderadamente ativo", description: "Exercício moderado 3 a 5 dias por semana" },
  { id: "intenso", label: "Muito ativo", description: "Exercício intenso 6 a 7 dias por semana" },
  { id: "extremo", label: "Extremamente ativo", description: "Treino pesado diário ou trabalho físico" },
] as const;

export const GOALS = [
  { id: "perder", label: "Perder peso", description: "Déficit de 500 kcal/dia (cerca de 0,5 kg por semana)" },
  { id: "manter", label: "Manter peso", description: "Consumo igual ao gasto diário" },
  { id: "ganhar", label: "Ganhar peso", description: "Superávit de 300 kcal/dia" },
] as const;

export const MEALS_PER_DAY = [3, 4, 5, 6] as const;

/** Tipo de alimentação: o backend tira do plano e das sugestões o que a dieta exclui. */
export const DIETS = [
  { id: "onivora", label: "Sem restrição", description: "Como de tudo" },
  { id: "pescetariana", label: "Pescetariana", description: "Sem carnes; com peixes, ovos e laticínios" },
  { id: "vegetariana", label: "Vegetariana", description: "Sem carnes e peixes; com ovos e laticínios" },
  { id: "vegana", label: "Vegana", description: "Nada de origem animal" },
] as const;

/** Tamanho máximo do texto de preferências. */
export const PREFERENCES_MAX = 500;

/** `id` segue `Date.getDay()` (0 = domingo); a lista começa na segunda. */
export const WEEKDAYS = [
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" },
  { id: 0, label: "Domingo" },
] as const;

export type Profile = {
  sex: (typeof SEXES)[number]["id"];
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: (typeof ACTIVITY_LEVELS)[number]["id"];
  goal: (typeof GOALS)[number]["id"];
  /** Quantas refeições a pessoa consegue fazer por dia. */
  mealsPerDay: (typeof MEALS_PER_DAY)[number];
  /** Dia da semana em que o app lembra de registrar o peso. */
  weighInDay: (typeof WEEKDAYS)[number]["id"];
  diet: (typeof DIETS)[number]["id"];
  /** Gostos, rotina, intolerâncias… em texto livre (pode ser vazio). Vai para o assistente. */
  preferences: string;
};
