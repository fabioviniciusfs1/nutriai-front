import { Topbar } from "@/components/dashboard/Topbar";
import { CalorieChart } from "@/components/dashboard/CalorieChart";
import { MacroDonut } from "@/components/dashboard/MacroDonut";
import { MealPlan } from "@/components/dashboard/MealPlan";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <Topbar />

        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CalorieChart />
          </div>
          <MacroDonut />
        </div>

        <MealPlan />
      </div>
    </div>
  );
}
