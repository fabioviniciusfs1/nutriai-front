import { AuthGuard } from "@/components/auth/AuthGuard";
import { Topbar } from "@/components/dashboard/Topbar";
import { MacroDonut } from "@/components/dashboard/MacroDonut";
import { MealPlan } from "@/components/dashboard/MealPlan";

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <Topbar />

          <MacroDonut />
          <MealPlan />
        </div>
      </div>
    </AuthGuard>
  );
}
