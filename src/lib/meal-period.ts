export type MealPeriod = "manha" | "tarde" | "noite";

/** Período do dia de um horário "HH:MM": manhã até 10:59, tarde até 16:59, noite depois. */
export function mealPeriod(time: string): MealPeriod {
  if (time < "11:00") return "manha";
  if (time < "17:00") return "tarde";
  return "noite";
}
