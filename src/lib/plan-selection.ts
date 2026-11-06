// Plano aberto no painel: o de hoje (`null`) ou o de outro grupo de dias da rotina. As rotas do plano levam
// `?plan=<id>` quando não é o de hoje.
import { useSyncExternalStore } from "react";
import type { Weekday } from "@/lib/profile";

let selected: number | null = null;
const listeners = new Set<() => void>();

export function selectPlan(id: number | null) {
  selected = id;
  for (const listener of listeners) listener();
}

export function useSelectedPlan() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selected,
    () => null
  );
}

/** `path` com o plano aberto (sem nada no de hoje). */
export function withPlan(path: string, plan: number | null = selected) {
  if (plan === null) return path;
  return `${path}${path.includes("?") ? "&" : "?"}plan=${plan}`;
}

const SHORT_DAYS: Record<Weekday, string> = { 0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb" };
const WEEK: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

/** Os dias de um plano: "Todos os dias", "Fim de semana", "Seg a Sex" ou "Seg, Qui e Sex". */
export function daysLabel(days: Weekday[]) {
  const sorted = WEEK.filter((day) => days.includes(day));
  if (sorted.length === 7) return "Todos os dias";
  if (sorted.length === 2 && sorted.includes(6) && sorted.includes(0)) return "Fim de semana";
  if (sorted.length === 5 && sorted.every((day) => day >= 1 && day <= 5)) return "Seg a Sex";
  const names = sorted.map((day) => SHORT_DAYS[day]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} e ${names.at(-1)}` : names[0];
}
