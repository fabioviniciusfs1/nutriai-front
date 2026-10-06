import { AuthGuard } from "@/components/auth/AuthGuard";
import { Topbar } from "@/components/dashboard/Topbar";
import { NutrientsOverview } from "@/components/nutrition/NutrientsOverview";

export default function NutrientesPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <Topbar />
          <NutrientsOverview />
        </div>
      </div>
    </AuthGuard>
  );
}
