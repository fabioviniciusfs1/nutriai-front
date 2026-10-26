import { AuthGuard } from "@/components/auth/AuthGuard";
import { Topbar } from "@/components/dashboard/Topbar";
import { DietAdjustmentForm } from "@/components/diet/DietAdjustmentForm";

export default function AjusteDietaPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <Topbar />
          <h2 className="text-lg font-semibold text-neutral-900">Ajuste da dieta</h2>
          <DietAdjustmentForm />
        </div>
      </div>
    </AuthGuard>
  );
}
