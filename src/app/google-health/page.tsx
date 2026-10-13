import { AuthGuard } from "@/components/auth/AuthGuard";
import { Topbar } from "@/components/dashboard/Topbar";
import { GoogleHealthCard } from "@/components/profile/GoogleHealthCard";

export default function GoogleHealthPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <Topbar />
          <h2 className="text-lg font-semibold text-neutral-900">Conexão Google Health</h2>
          {/* Mesma grade dos formulários de perfil e rotina: no desktop, o card fica da largura da coluna deles. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <GoogleHealthCard />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
