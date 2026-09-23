"use client";

import { useState } from "react";
import { ArrowRight, Undo2 } from "lucide-react";
import { FOOD_FEEDBACK } from "@/lib/food-feedback";
import { releaseFood, useAuth } from "@/lib/auth";
import { catalogEntry } from "@/lib/food-substitution";
import { FOOD_GROUPS } from "@/lib/mock-data";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";

// Alimentos que o usuário marcou como "Não gosto / Não quero / Não tenho". Enquanto marcados, o
// assistente não os recomenda. "Liberar" só tira essa restrição: as trocas já feitas nas
// refeições continuam (o alimento não volta sozinho para o plano).
export function MarkedFoods() {
  const auth = useAuth();
  const feedback = auth?.foodFeedback ?? {};
  const substitutes = auth?.foodSubstitutes ?? {};
  const [releasing, setReleasing] = useState<string | null>(null);

  const total = Object.keys(feedback).length;

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Alimentos</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Alimentos que você marcou. O assistente não os recomenda enquanto estiverem aqui. Se mudar de ideia,
          libere o alimento para ele voltar a aparecer nas próximas sugestões.
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
          Nenhum alimento marcado. Use os botões &ldquo;Não gosto&rdquo;, &ldquo;Não quero&rdquo; ou &ldquo;Não
          tenho&rdquo; nos alimentos do plano alimentar.
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
        {total > 0 &&
          FOOD_FEEDBACK.map(({ id, label, Icon }) => {
            const foods = Object.keys(feedback)
              .filter((name) => feedback[name] === id)
              .sort((a, b) => a.localeCompare(b, "pt-BR"));

            return (
              <section key={id} className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 font-semibold text-neutral-900">
                  <Icon size={18} className="text-neutral-500" /> {label}
                  <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {foods.length}
                  </span>
                </h3>

                {foods.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-400">Nenhum alimento.</p>
                ) : (
                  <ul className="mt-3 flex flex-col divide-y divide-neutral-100">
                    {foods.map((name) => {
                      const group = catalogEntry(name)?.group;
                      return (
                        <li key={name} className="flex items-center gap-3 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-900">{name}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-neutral-500">
                              {group && <span>{FOOD_GROUPS[group]} ·</span>}
                              {id === "nao-quero" ? (
                                "trocado só na refeição marcada"
                              ) : substitutes[name] ? (
                                <>
                                  substituído por <ArrowRight size={12} />
                                  <span className="font-medium text-neutral-700">{substitutes[name]}</span>
                                </>
                              ) : (
                                "removido das refeições"
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReleasing(name)}
                            className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                          >
                            <Undo2 size={14} /> Liberar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
      </div>

      <ConfirmDialog
        open={releasing !== null}
        title={`Liberar "${releasing ?? ""}"?`}
        description={`O assistente volta a poder recomendar ${releasing ?? ""} nas próximas sugestões. As trocas já feitas nas refeições continuam.`}
        confirmLabel="Liberar"
        onConfirm={() => {
          if (releasing) releaseFood(releasing);
          setReleasing(null);
        }}
        onCancel={() => setReleasing(null)}
      />
    </>
  );
}
