import { AuthGuard } from "@/components/auth/AuthGuard";
import { Topbar } from "@/components/dashboard/Topbar";
import { NutrientSection } from "@/components/nutrition/NutrientSection";
import { fibers, macroBreakdown, minerals, otherMacros, vitamins } from "@/lib/mock-data";

const macros = [
  ...macroBreakdown.map(({ name, atual, meta }) => ({ name, atual, meta, unit: "g" })),
  ...otherMacros,
];

export default function NutrientesPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <Topbar />

          <NutrientSection
            title="Macronutrientes"
            description="Consumo de hoje em relação à meta diária"
            groups={[{ title: "", nutrients: macros }]}
          />
          <NutrientSection
            title="Micronutrientes"
            description="Ingestão diária recomendada"
            groups={[
              { title: "Vitaminas", nutrients: vitamins },
              { title: "Minerais", nutrients: minerals },
            ]}
          />
          <NutrientSection
            title="Fibras"
            description="Consumo de hoje em relação à meta diária"
            groups={[{ title: "", nutrients: fibers }]}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
