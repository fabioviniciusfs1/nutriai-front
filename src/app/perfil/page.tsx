import { AuthGuard } from "@/components/auth/AuthGuard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { GoogleHealthCard } from "@/components/profile/GoogleHealthCard";

export default function PerfilPage() {
  return (
    <AuthGuard requireProfile={false}>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <ProfileHeader />
          <ProfileForm />
          <GoogleHealthCard />
        </div>
      </div>
    </AuthGuard>
  );
}
