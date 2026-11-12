// Central de notificações: derivadas do estado que o backend já manda (pesagem, sugestão do ajuste das
// calorias e feedback). Cada uma fica até ser resolvida (a de pesagem, até registrar o peso; a das calorias, até
// ajustar as calorias, escolher um novo peso meta ou as pesagens mudarem; a de feedback, até responder).
import { useAuth } from "@/lib/auth";

export type AppNotification = { id: string; kind: "weigh-in" | "calories" | "feedback"; title: string; text: string };

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
  if (auth?.feedbackPending)
    notifications.push({
      id: "feedback",
      kind: "feedback",
      title: "Conte o que achou do Alere.ai",
      text: "Responda o formulário de validação: leva poucos minutos e nos ajuda a melhorar o app.",
    });
  return notifications;
}
