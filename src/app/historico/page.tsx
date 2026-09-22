import { Topbar } from "@/components/dashboard/Topbar";
import { HistoryDashboard } from "@/components/history/HistoryDashboard";
import { PlanHistory } from "@/components/history/PlanHistory";

export default function HistoricoPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <Topbar />
        <HistoryDashboard />
        <PlanHistory />
      </div>
    </div>
  );
}
