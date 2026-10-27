// Central de notificações: derivadas do estado que o backend já manda (pesagem e sugestão do ajuste das
// calorias). Cada uma fica até ser resolvida (a de pesagem, até registrar o peso; a das calorias, até ajustar
// as calorias, escolher um novo peso meta ou as pesagens mudarem).
import { useAuth } from "@/lib/auth";

export type AppNotification = { id: string; kind: "weigh-in" | "calories"; title: string; text: string };

/** As notificações de agora. */
export function useNotifications(): AppNotification[] {
  const auth = useAuth();
  const weighInDue = auth?.weighInDue ?? false;
  const advice = auth?.calorieAdvice ?? null;
  const notifications: AppNotification[] = [];
  if (weighInDue)
    notifications.push({
      id: "weigh-in",
      kind: "weigh-in",
      title: "Hoje é dia de pesagem",
      text: "Registre seu peso para acompanhar sua evolução no histórico.",
    });
  if (advice) notifications.push({ id: "calories", kind: "calories", title: advice.title, text: advice.text });
  return notifications;
}
