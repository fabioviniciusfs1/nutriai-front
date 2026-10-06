import type { Metadata } from "next";
import { GoogleCallback } from "@/components/auth/GoogleCallback";

export const metadata: Metadata = {
  title: "NutriAI | Entrar com Google",
};

export default function GoogleLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <GoogleCallback />
    </div>
  );
}
