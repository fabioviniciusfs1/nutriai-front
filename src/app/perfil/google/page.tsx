import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { GoogleConnectCallback } from "@/components/profile/GoogleConnectCallback";

export const metadata: Metadata = {
  title: "NutriAI | Conectar Google",
};

export default function GoogleConnectPage() {
  return (
    <AuthGuard requireProfile={false}>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <GoogleConnectCallback />
      </div>
    </AuthGuard>
  );
}
