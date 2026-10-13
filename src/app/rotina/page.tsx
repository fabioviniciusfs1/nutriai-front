import { AuthGuard } from "@/components/auth/AuthGuard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { RoutineForm } from "@/components/profile/RoutineForm";

export default function RotinaPage() {
  return (
    <AuthGuard requireRoutine={false}>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <ProfileHeader title="Minha rotina" step={2} />
          <RoutineForm />
        </div>
      </div>
    </AuthGuard>
  );
}
