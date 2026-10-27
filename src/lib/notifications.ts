// Central de notificações: derivadas do estado que o backend já manda (hoje, só a de pesagem). Cada uma fica
// até ser resolvida (a de pesagem, até registrar o peso).
import { useAuth } from "@/lib/auth";

export type AppNotification = { id: string; kind: "weigh-in"; title: string; text: string };

/** As notificações de agora. */
export function useNotifications(): AppNotification[] {
  const weighInDue = useAuth()?.weighInDue ?? false;
  const notifications: AppNotification[] = [];
  if (weighInDue)
    notifications.push({
      id: "weigh-in",
      kind: "weigh-in",
      title: "Hoje é dia de pesagem",
      text: "Registre seu peso para acompanhar sua evolução no histórico.",
    });
  return notifications;
}
