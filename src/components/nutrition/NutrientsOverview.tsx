"use client";

import { useApiQuery } from "@/lib/api/query";
import type { NutritionToday } from "@/lib/api/types";
import { QueryStatus } from "@/components/api/QueryStatus";
import { NutrientSection } from "@/components/nutrition/NutrientSection";

export function NutrientsOverview() {
  const { data, error, reload } = useApiQuery<NutritionToday>("/nutrition/today");
  if (!data) return <QueryStatus title="Nutrientes" error={error} onRetry={reload} />;

  return (
    <>
      <NutrientSection
        title="Macronutrientes"
        description="Consumo de hoje em relação à meta diária"
        groups={[{ title: "", nutrients: [...data.macros, ...data.otherMacros] }]}
      />
      <NutrientSection
        title="Micronutrientes"
        description="Ingestão diária recomendada"
        groups={[
          { title: "Vitaminas", nutrients: data.vitamins },
          { title: "Minerais", nutrients: data.minerals },
        ]}
      />
      <NutrientSection
        title="Fibras"
        description="Consumo de hoje em relação à meta diária"
        groups={[{ title: "", nutrients: data.fibers }]}
      />
    </>
  );
}
