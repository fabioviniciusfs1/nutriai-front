"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PlanMeal } from "@/lib/api/types";
import { mealSlotLabel } from "@/lib/profile";

const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

const timeText = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** O eixo é o dia inteiro, de 00:00 a 23:59 (o mesmo em todos os planos). */
const DAY_END = 23 * 60 + 59;

/** Rótulos das horas: a cada 3 h e o fim do dia. */
const LABELS = [...Array.from({ length: 8 }, (_, index) => index * 180), DAY_END];

/** Refeições a menos que isso uma da outra alternam os rótulos entre perto e longe da linha. */
const CLOSE_MINUTES = 60;

/** De quanto em quanto tempo vai uma barra da faixa. */
const BAR_MINUTES = 15;

/** Minutos do dia agora, no relógio do navegador (o mesmo fuso que o front manda à API); atualiza a cada minuto. */
function useNow() {
  const read = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };
  const [now, setNow] = useState(read);
  useEffect(() => {
    const timer = setInterval(() => setNow(read()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** "em 1h10", "em 25 min". */
function untilText(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `em ${rest} min`;
  return `em ${hours}h${rest > 0 ? String(rest).padStart(2, "0") : ""}`;
}

/**
 * Linha do tempo horizontal das refeições do dia, de 00:00 a 23:59: um ponto por refeição na posição do horário, a marca "Agora"
 * (só no plano de hoje), as que já passaram esmaecidas e a próxima destacada. Tocar num ponto mostra a refeição
 * embaixo (`renderMeal`).
 */
export function MealTimeline({
  meals,
  active,
  renderMeal,
}: {
  meals: PlanMeal[];
  /** Plano de hoje: tem "Agora", passadas e próxima. */
  active: boolean;
  renderMeal: (meal: PlanMeal) => ReactNode;
}) {
  const now = useNow();
  const times = meals.map((meal) => minutesOf(meal.time));
  const position = (minutes: number) => (minutes / DAY_END) * 100;

  const next = active ? meals.find((meal) => minutesOf(meal.time) >= now) : undefined;
  const [chosenId, setChosenId] = useState<number | null>(null);
  // No celular a faixa rola: ela abre centrada em "Agora" (nos outros planos, na primeira refeição). Só uma vez
  // (o plano novo monta outra linha do tempo): depois, quem rola é a pessoa.
  const centered = useRef(false);
  const centerOnOpen = (track: HTMLDivElement | null) => {
    const scroller = track?.parentElement;
    if (!track || !scroller || centered.current) return;
    centered.current = true;
    const focus = active ? now : (times[0] ?? 0);
    const x = track.offsetLeft + (position(focus) / 100) * track.clientWidth;
    scroller.scrollLeft = x - scroller.clientWidth / 2;
  };
  const chosen = meals.find((meal) => meal.id === chosenId) ?? next ?? meals[0];
  const showNow = active;

  // Rótulo mais longe da linha quando a refeição está perto da anterior que ficou com o rótulo perto.
  const far: boolean[] = [];
  meals.forEach((_, index) => {
    far.push(index > 0 && !far[index - 1] && times[index] - times[index - 1] < CLOSE_MINUTES);
  });
  // Uma barra a cada 15 minutos (de 00:00 a 23:45) e a do fim do dia; as das horas cheias e a do fim, mais altas.
  const bars = [...Array.from({ length: (24 * 60) / BAR_MINUTES }, (_, index) => index * BAR_MINUTES), DAY_END];

  return (
    <div className="mt-4">
      <div className="overflow-x-auto pb-2">
        <div ref={centerOnOpen} className={`relative mx-6 min-w-[560px] ${far.some(Boolean) ? "h-36" : "h-28"}`}>
          {/* Horas (a cada 3 h e o fim do dia), logo acima das barras. */}
          {LABELS.map((minutes) => (
            <span
              key={minutes}
              aria-hidden
              className="absolute top-[22px] -translate-x-1/2 text-[10px] tabular-nums text-neutral-400"
              style={{ left: `${position(minutes)}%` }}
            >
              {timeText(minutes)}
            </span>
          ))}

          {bars.map((minutes) => (
            <span
              key={minutes}
              aria-hidden
              className={`absolute top-[52px] w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                minutes % 60 === 0 || minutes === DAY_END ? "h-5" : "h-2.5"
              } ${active && minutes < now ? "bg-accent/30" : "bg-accent"}`}
              style={{ left: `${position(minutes)}%` }}
            />
          ))}

          {showNow && (
            <div
              className="absolute top-0 flex h-[68px] -translate-x-1/2 flex-col items-center"
              style={{ left: `${position(now)}%` }}
            >
              <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Agora
              </span>
              <span className="w-px flex-1 bg-neutral-900/60" />
            </div>
          )}

          {meals.map((meal, index) => {
            const minutes = times[index];
            const past = active && minutes < now;
            const isNext = meal.id === next?.id;
            const isChosen = meal.id === chosen?.id;
            return (
              <button
                key={meal.id}
                type="button"
                aria-pressed={isChosen}
                aria-label={`${mealSlotLabel(meal.slot)}, ${meal.time}`}
                onClick={() => setChosenId(meal.id)}
                className={`group absolute top-[52px] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${
                  past ? "opacity-45" : ""
                }`}
                style={{ left: `${position(minutes)}%` }}
              >
                <span
                  className={`block h-4 w-4 rounded-full border-2 transition-transform group-hover:scale-125 ${
                    isChosen ? "border-accent bg-accent" : "border-accent bg-white"
                  } ${isNext ? "ring-4 ring-accent/25" : ""}`}
                />
                <span
                  className={`absolute flex w-28 flex-col items-center text-center leading-tight ${
                    far[index] ? "top-12" : "top-6"
                  }`}
                >
                  <span className={`text-xs font-medium ${isChosen ? "text-accent" : "text-neutral-800"}`}>
                    {mealSlotLabel(meal.slot)}
                  </span>
                  <span className="text-[11px] tabular-nums text-neutral-500">{meal.time}</span>
                  {isNext && (
                    <span className="mt-0.5 rounded-full bg-accent/15 px-1.5 text-[10px] font-medium text-accent">
                      Próxima, {untilText(minutes - now)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {chosen && <div className="mt-2">{renderMeal(chosen)}</div>}
    </div>
  );
}
