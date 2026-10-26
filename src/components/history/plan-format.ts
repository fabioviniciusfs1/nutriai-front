import type { PlanHistoryChange, PlanHistoryFood } from "@/lib/api/types";

/** Quantidade como no plano do dia: ovos em unidades, o resto em gramas. */
export function amount(food: PlanHistoryFood) {
  if (food.units !== undefined) return `${food.units} ${food.units === 1 ? "ovo" : "ovos"}`;
  return `${food.grams} g`;
}

/** Uma mudança do plano em texto (sem a refeição). */
export function changeText(change: PlanHistoryChange) {
  const { from, to } = change;
  switch (change.kind) {
    case "swap":
      return `${from!.name} → ${to!.name}`;
    case "added":
      return `+ ${to!.name} (${amount(to!)})`;
    case "removed":
      return `− ${from!.name}`;
    case "grams":
      return `${to!.name}: ${amount(from!)} → ${amount(to!)}`;
  }
}
