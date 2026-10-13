// Opções dos formulários de perfil e de rotina. As contas (meta calórica, água) são feitas pelo backend.
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

/** Refeições do dia, na ordem em que acontecem; a pessoa marca as que faz. */
export const MEAL_SLOTS = [
  { id: "cafe-da-manha", label: "Café da manhã" },
  { id: "lanche-da-manha", label: "Lanche da manhã" },
  { id: "almoco", label: "Almoço" },
  { id: "lanche-da-tarde", label: "Lanche da tarde" },
  { id: "jantar", label: "Janta" },
  { id: "ceia", label: "Ceia" },
] as const;

/** Períodos do dia (o backend usa os mesmos: manhã até 10:59, tarde até 16:59, noite depois). */
export const DAY_PERIODS = [
  { id: "manha", label: "Manhã" },
  { id: "tarde", label: "Tarde" },
  { id: "noite", label: "Noite" },
] as const;

/** Tipo de alimentação: o backend tira do plano e das sugestões o que a dieta exclui. */
export const DIETS = [
  { id: "onivora", label: "Sem restrição", description: "Como de tudo" },
  { id: "pescetariana", label: "Pescetariana", description: "Sem carnes; com peixes, ovos e laticínios" },
  { id: "vegetariana", label: "Vegetariana", description: "Sem carnes e peixes; com ovos e laticínios" },
  { id: "vegana", label: "Vegana", description: "Nada de origem animal" },
] as const;

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
};

export type MealSlot = (typeof MEAL_SLOTS)[number]["id"];
export type DayPeriod = (typeof DAY_PERIODS)[number]["id"];

/** Janela em que dá para comer, "HH:MM". */
export type EatingWindow = { start: string; end: string };

const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const hourText = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/** Horas do dia (0 a 23) que as janelas tocam: `07:00–08:30` dá 7 e 8. */
export function hoursOfWindows(windows: EatingWindow[]): number[] {
  return Array.from({ length: 24 }, (_, hour) => hour).filter((hour) =>
    windows.some((window) => minutesOf(window.start) < (hour + 1) * 60 && minutesOf(window.end) > hour * 60)
  );
}

/** Horários da rotina que tiram horas da grade de horários para comer. */
export type BusyTimes = { wakeTime: string; sleepTime: string; trainingStart: string; trainingEnd: string };

/**
 * Horas do dia (0 a 23) em que não dá para comer: a pessoa está dormindo (de `sleepTime` até `wakeTime`) ou
 * treinando em qualquer parte da hora. Os intervalos podem passar da meia-noite. Mesma regra do backend.
 */
export function unavailableHours({ wakeTime, sleepTime, trainingStart, trainingEnd }: BusyTimes): number[] {
  const busy = (hour: number, from: string, to: string) => {
    const [a, b] = [minutesOf(from), minutesOf(to)];
    const within = (x: number, y: number) => hour * 60 < y && (hour + 1) * 60 > x;
    return a < b ? within(a, b) : a > b && (within(a, 1440) || within(0, b));
  };
  return Array.from({ length: 24 }, (_, hour) => hour).filter(
    (hour) => busy(hour, sleepTime, wakeTime) || busy(hour, trainingStart, trainingEnd)
  );
}

/**
 * Janelas das horas marcadas: cada hora vale até a hora cheia seguinte e as vizinhas viram uma janela só
 * (7, 8 e 12 → `07:00–09:00` e `12:00–13:00`). A das 23 termina em `23:59` (o contrato não tem `24:00`).
 */
export function windowsOfHours(hours: number[]): EatingWindow[] {
  const windows: EatingWindow[] = [];
  let previous: number | null = null;
  for (const hour of [...hours].sort((a, b) => a - b)) {
    const end = hour === 23 ? "23:59" : hourText(hour + 1);
    if (previous === hour - 1) windows[windows.length - 1].end = end;
    else windows.push({ start: hourText(hour), end });
    previous = hour;
  }
  return windows;
}

/** Rotina e preferências alimentares: o assistente monta o plano individual a partir dela. */
export type Routine = {
  /** Em ordem, sem sobreposição e com início antes do fim. De 1 a 12. */
  eatingWindows: EatingWindow[];
  /** "HH:MM" */
  wakeTime: string;
  /** "HH:MM"; pode ser antes de `wakeTime` (dorme depois da meia-noite). */
  sleepTime: string;
  /** "HH:MM"; `null` só em rotinas antigas salvas como "não treino" (o `PUT` exige os dois horários do treino). */
  trainingStart: string | null;
  /** "HH:MM"; pode ser antes de `trainingStart` (treino que passa da meia-noite). */
  trainingEnd: string | null;
  /** Refeições que a pessoa faz no dia: pelo menos uma, sem repetir, na ordem do dia. */
  meals: MealSlot[];
  /** Período do dia em que sente mais fome. */
  hungriestPeriod: DayPeriod;
  /** Período do dia em que sente menos fome (diferente de `hungriestPeriod`). */
  leastHungryPeriod: DayPeriod;
  /** Dia da semana em que o app lembra de registrar o peso. */
  weighInDay: (typeof WEEKDAYS)[number]["id"];
  diet: (typeof DIETS)[number]["id"];
};
