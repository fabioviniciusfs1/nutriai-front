import { AuthGuard } from "@/components/auth/AuthGuard";
import { Topbar } from "@/components/dashboard/Topbar";
import { MarkedFoods } from "@/components/foods/MarkedFoods";

export default function AlimentosPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <Topbar />
          <MarkedFoods />
        </div>
      </div>
    </AuthGuard>
  );
}
