"use client";

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { AvoidOption, AvoidRule, AvoidScope } from "@/lib/api/types";
import { Spinner } from "@/components/api/QueryStatus";

const plural = (count: number) => (count === 1 ? "1 alimento" : `${count} alimentos`);

/** Como a regra aparece na lista das escolhidas. */
export function avoidScopeText(scope: AvoidScope) {
  return scope === "ingrediente" ? "e o que leva" : "só o alimento";
}

/**
 * "Alimentos que você não come": a pessoa pesquisa ("batata"), escolhe o tipo (batata inglesa, batata doce…) e se
 * tira só o alimento ou também o que leva ele no nome. O backend separa os tipos e conta o que sai em cada caso;
 * aqui só se monta a lista de regras (`onChange` recebe a lista inteira).
 */
export function AvoidFoods({ rules, onChange }: { rules: AvoidRule[]; onChange: (rules: AvoidRule[]) => void }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<AvoidOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Só a resposta da última pesquisa vale.
  const lastRequest = useRef(0);

  async function search() {
    const text = query.trim();
    if (!text) return;
    const request = ++lastRequest.current;
    setLoading(true);
    setError(null);
    try {
      const found = await apiFetch<AvoidOption[]>(`/foods/avoid/search?q=${encodeURIComponent(text)}`);
      if (request === lastRequest.current) setOptions(found);
    } catch (searchError) {
      if (request === lastRequest.current)
        setError(searchError instanceof ApiError ? searchError.message : "Erro inesperado.");
    } finally {
      if (request === lastRequest.current) setLoading(false);
    }
  }

  function choose(option: AvoidOption, scope: AvoidScope) {
    const rest = rules.filter((rule) => rule.kind !== option.kind);
    const current = rules.find((rule) => rule.kind === option.kind);
    // Clicar de novo no alcance escolhido tira a regra.
    onChange(current?.scope === scope ? rest : [...rest, { kind: option.kind, label: option.label, scope }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {rules.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Alimentos que você não come">
          {rules.map((rule) => (
            <li
              key={rule.kind}
              className="flex items-center gap-1.5 rounded-full bg-accent/15 py-1 pl-3 pr-1 text-sm text-accent"
            >
              <span className="font-medium">{rule.label}</span>
              <span className="text-xs text-accent/80">({avoidScopeText(rule.scope)})</span>
              <button
                type="button"
                onClick={() => onChange(rules.filter((item) => item.kind !== rule.kind))}
                aria-label={`Tirar ${rule.label}`}
                className="rounded-full p-1 hover:bg-accent/20"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            // Enter pesquisa em vez de enviar o formulário em volta.
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
          placeholder="Ex.: cenoura, batata, fígado…"
          aria-label="Pesquisar alimento que você não come"
          className="min-w-0 flex-1 basis-48 rounded-xl bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 outline-none ring-1 ring-neutral-200 focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={!query.trim()}
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Search size={16} /> Pesquisar
        </button>
      </div>

      {loading && <Spinner className="h-5 w-5" />}
      {error && <p className="text-sm text-neutral-600">{error}</p>}
      {!loading && options !== null && options.length === 0 && (
        <p className="text-sm text-neutral-500">Nenhum alimento encontrado. Tente outro nome.</p>
      )}

      {!loading && options !== null && options.length > 0 && (
        <ul className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200">
          {options.map((option) => {
            const current = rules.find((rule) => rule.kind === option.kind)?.scope;
            const extra = option.ingredient.count - option.foods.count;
            return (
              <li key={option.kind} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">{option.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                    {plural(option.foods.count)}
                    {option.foods.examples.length > 0 && `: ${option.foods.examples.join("; ")}`}
                    {option.foods.count > option.foods.examples.length && "…"}
                  </p>
                  {extra > 0 && option.ingredient.examples.length > 0 && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">
                      Levam {option.label.replace(" (todos os tipos)", "").toLowerCase()} no nome:{" "}
                      {option.ingredient.examples.join("; ")}
                      {extra > option.ingredient.examples.length && "…"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <ScopeButton
                    selected={current === "alimento"}
                    label="Só este alimento"
                    onClick={() => choose(option, "alimento")}
                  />
                  {extra > 0 && (
                    <ScopeButton
                      selected={current === "ingrediente"}
                      label={`Também o que leva (+${extra})`}
                      onClick={() => choose(option, "ingrediente")}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-neutral-500">
        Pratos prontos podem ter o alimento sem citá-lo no nome; esses o app não consegue identificar.
      </p>
    </div>
  );
}

function ScopeButton({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        selected ? "bg-accent text-white" : "bg-accent/15 text-accent hover:bg-accent/25"
      }`}
    >
      {label}
    </button>
  );
}
