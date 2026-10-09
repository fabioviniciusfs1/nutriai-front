import { notFound } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Topbar } from "@/components/dashboard/Topbar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { CHAT_ENABLED } from "@/lib/features";

export default function ChatPage() {
  if (!CHAT_ENABLED) notFound();
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <Topbar />
          <ChatPanel />
        </div>
      </div>
    </AuthGuard>
  );
}
