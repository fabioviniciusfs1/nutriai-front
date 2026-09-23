import { AuthGuard } from "@/components/auth/AuthGuard";
import { Topbar } from "@/components/dashboard/Topbar";
import { NutrientCard } from "@/components/nutrition/NutrientCard";
import { macroBreakdown, minerals, otherMacros, vitamins } from "@/lib/mock-data";

const macros = [
  ...macroBreakdown.map((macro) => ({
    name: macro.name,
    atual: macro.atual,
    meta: macro.meta,
    unit: "g",
    color: macro.color,
  })),
  ...otherMacros,
];

export default function NutrientesPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <Topbar />

          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
            <NutrientCard
              title="Macronutrientes"
              description="Consumo de hoje em relação à meta diária"
              nutrients={macros}
            />
            <NutrientCard
              title="Vitaminas"
              description="Ingestão diária recomendada"
              nutrients={vitamins}
            />
            <NutrientCard
              title="Minerais"
              description="Ingestão diária recomendada"
              nutrients={minerals}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
