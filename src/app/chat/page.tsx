import { Topbar } from "@/components/dashboard/Topbar";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <Topbar />
        <ChatPanel />
      </div>
    </div>
  );
}
