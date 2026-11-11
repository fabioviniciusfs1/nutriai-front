"use client";

import { useState } from "react";
import { ArrowRight, Undo2 } from "lucide-react";
import { FOOD_FEEDBACK, type FoodFeedback } from "@/lib/food-feedback";
import { FOOD_GROUPS } from "@/lib/food-groups";
import { useApiQuery } from "@/lib/api/query";
import { AVOID_PATH, releaseFood, RESTRICTED_FOODS_PATH, saveAvoidRules } from "@/lib/api/actions";
import type { AvoidRule, RestrictedFood } from "@/lib/api/types";
import { QueryStatus } from "@/components/api/QueryStatus";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";

/** Uma linha da lista: um alimento marcado no plano ou, no "Não gosto", um tipo de alimento ("Alimentos que você não come"). */
type Marked = { kind: "food"; name: string; food: RestrictedFood } | { kind: "rule"; name: string; rule: AvoidRule };

// Alimentos que o usuário marcou como "Não gosto / Não quero / Não tenho". Enquanto marcados, o
// assistente não os recomenda. "Liberar" só tira essa restrição: as trocas já feitas nas
// refeições continuam (o alimento não volta sozinho para o plano). No "Não gosto" ficam também os
// tipos de alimento que a pessoa não come (passo 2 ou "Não como … em nenhum preparo"): liberar um deles
// devolve os alimentos ao plano, porque a troca deles é calculada.
export function MarkedFoods() {
  const restricted = useApiQuery<RestrictedFood[]>(RESTRICTED_FOODS_PATH);
  const avoid = useApiQuery<AvoidRule[]>(AVOID_PATH);
  const [releasing, setReleasing] = useState<Marked | null>(null);
  const [tab, setTab] = useState<FoodFeedback>("nao-gosto");

  const foods = restricted.data ?? [];
  const rules = avoid.data ?? [];
  const current = FOOD_FEEDBACK.find((item) => item.id === tab)!;
  const markedIn = (id: FoodFeedback): Marked[] => [
    ...(id === "nao-gosto" ? rules.map((rule) => ({ kind: "rule" as const, name: rule.label, rule })) : []),
    ...foods.filter((food) => food.feedback === id).map((food) => ({ kind: "food" as const, name: food.name, food })),
  ];
  const marked = markedIn(tab).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const loaded = restricted.data && avoid.data;

  function release(item: Marked) {
    if (item.kind === "food") void releaseFood(item.name);
    else void saveAvoidRules(rules.filter((rule) => rule.kind !== item.rule.kind));
  }

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Alimentos</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Alimentos que você marcou. O assistente não os recomenda enquanto estiverem aqui. Se mudar de ideia,
          libere o alimento para ele voltar a aparecer nas próximas sugestões.
        </p>
      </div>

      {/*
        Uma aba por motivo. No celular a barra ocupa a largura da página e as abas rolam por dentro dela: duas cabem e
        ~20% da terceira aparece cortada na borda (2,2 abas na largura), para mostrar que dá para deslizar.
      */}
      <div
        role="tablist"
        aria-label="Motivo"
        className="flex gap-1.5 overflow-x-auto rounded-full p-1 sm:w-fit sm:gap-2"
      >
        {FOOD_FEEDBACK.map(({ id, label, Icon }) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={selected}
              aria-controls="foods-panel"
              onClick={() => setTab(id)}
              className={`flex w-[calc((100vw-2.5rem-4px)/2.2)] min-w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2 text-sm font-medium transition-colors sm:w-auto sm:gap-2 sm:px-4 ${
                selected ? "bg-accent text-white" : "bg-accent/15 text-accent hover:bg-accent/25"
              }`}
            >
              <Icon size={16} /> {label}
              {loaded && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-medium sm:px-2 ${
                    selected ? "bg-white/25 text-white" : "bg-white/70 text-accent"
                  }`}
                >
                  {markedIn(id).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!loaded && (
        <QueryStatus
          error={restricted.error ?? avoid.error}
          onRetry={() => {
            restricted.reload();
            avoid.reload();
          }}
        />
      )}

      {loaded && (
        <section
          role="tabpanel"
          id="foods-panel"
          aria-labelledby={`tab-${tab}`}
          className="rounded-2xl bg-white p-5 shadow-sm"
        >
          {marked.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">
              Nenhum alimento marcado como &ldquo;{current.label}&rdquo;. Use o botão &ldquo;Substituir
              alimento&rdquo; nos alimentos do plano alimentar.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-neutral-200">
              {marked.map((item) => (
                <li key={`${item.kind}-${item.name}`} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-neutral-500">
                      {item.kind === "rule" ? (
                        item.rule.scope === "ingrediente" ? (
                          `todos os preparos e o que leva ${item.rule.label.replace(" (todos os tipos)", "").toLowerCase()}`
                        ) : (
                          "todos os preparos"
                        )
                      ) : (
                        <>
                          {item.food.group && <span>{FOOD_GROUPS[item.food.group]} ·</span>}
                          {item.food.onlyInMeal ? (
                            "trocado só na refeição marcada"
                          ) : item.food.substitute ? (
                            <>
                              substituído por <ArrowRight size={12} />
                              <span className="font-medium text-neutral-700">{item.food.substitute}</span>
                            </>
                          ) : (
                            "removido das refeições"
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReleasing(item)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/25"
                  >
                    <Undo2 size={14} /> Liberar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <ConfirmDialog
        open={releasing !== null}
        title={`Liberar "${releasing?.name ?? ""}"?`}
        description={
          releasing?.kind === "rule"
            ? `${releasing.name} volta ao plano e às sugestões, em todos os preparos.`
            : `O assistente volta a poder recomendar ${releasing?.name ?? ""} nas próximas sugestões. As trocas já feitas nas refeições continuam.`
        }
        confirmLabel="Liberar"
        onConfirm={() => {
          if (releasing) release(releasing);
          setReleasing(null);
        }}
        onCancel={() => setReleasing(null)}
      />
    </>
  );
}
