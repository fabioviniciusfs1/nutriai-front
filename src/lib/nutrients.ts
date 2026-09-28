import type { MacroId, Nutrient, NutritionToday } from "@/lib/api/types";

/** Cor de cada macro no card "Meta diária" e fator de Atwater para somar as calorias consumidas. */
export const MACRO_STYLE: Record<MacroId, { color: string; kcalPerGram: number }> = {
  proteinas: { color: "#f4623a", kcalPerGram: 4 },
  gorduras: { color: "#f9c9b8", kcalPerGram: 9 },
  carboidratos: { color: "#7fc1e8", kcalPerGram: 4 },
};

/** Calorias consumidas hoje, a partir dos gramas de cada macro. */
export function consumedKcal(nutrition: NutritionToday) {
  return nutrition.macros.reduce((sum, macro) => sum + macro.atual * (MACRO_STYLE[macro.id]?.kcalPerGram ?? 0), 0);
}

/** Os nutrientes da página Nutrientes agrupados para o seletor do gráfico do histórico. */
export function nutrientGroups(nutrition: NutritionToday): { name: string; nutrients: Nutrient[] }[] {
  return [
    { name: "Macronutrientes", nutrients: [...nutrition.macros, ...nutrition.fibers, ...nutrition.otherMacros] },
    { name: "Vitaminas", nutrients: nutrition.vitamins },
    { name: "Minerais", nutrients: nutrition.minerals },
  ].filter((group) => group.nutrients.length > 0);
}
