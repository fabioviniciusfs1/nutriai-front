"use client";

import { useState } from "react";
import { Egg, Minus, Plus } from "lucide-react";
import { useApiQuery } from "@/lib/api/query";
import { DIET_PATH, TODAY_PLAN_PATH, estimateDiet, saveDiet } from "@/lib/api/actions";
import type { DietAdjustment, MacroId, TodayPlan } from "@/lib/api/types";
import { MACRO_COLORS, MACRO_ORDER } from "@/lib/nutrients";
import { QueryStatus } from "@/components/api/QueryStatus";
import { MacroPieChart } from "@/components/diet/MacroPieChart";

const MACRO_NAMES: Record<MacroId, string> = {
  proteinas: "Proteínas",
  carboidratos: "Carboidratos",
  gorduras: "Gorduras",
};

/** Passo dos botões − e + (g/kg). */
const STEP = 0.1;

const perKgFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const numberFormat = new Intl.NumberFormat("pt-BR");

/** Valor mostrado (uma casa) mais o passo, também com uma casa. */
const stepped = (value: number, delta: number) => Math.round((Math.round(value * 10) / 10 + delta) * 10) / 10;

/**
 * Ajuste da dieta: proteína, gordura e carboidrato em g/kg (cada − / + pede ao backend a prévia com a
 * compensação), a pizza das % e o peso da unidade do ovo, quando o plano tem ovo.
 */
export function DietAdjustmentForm() {
  const { data, error, reload } = useApiQuery<DietAdjustment>(DIET_PATH);
  const plan = useApiQuery<TodayPlan>(TODAY_PLAN_PATH).data;
  // Prévia ainda não salva; `null` = o que está salvo.
  const [draft, setDraft] = useState<DietAdjustment | null>(null);
  const [eggText, setEggText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  if (!data) return <QueryStatus title="Ajuste da dieta" error={error} onRetry={reload} />;

  const current = draft ?? data;
  const usesEgg = plan?.meals.some((meal) => meal.foods.some((food) => food.units !== undefined)) ?? false;
  const eggValue = eggText ?? String(current.settings.eggUnitGrams);
  const changed = draft !== null || (eggText !== null && Number(eggText) !== data.settings.eggUnitGrams);

  async function step(macro: MacroId, delta: number) {
    setBusy(true);
    setSavedMessage(false);
    const result = await estimateDiet({
      proteinPerKg: current.settings.proteinPerKg,
      fatPerKg: current.settings.fatPerKg,
      macro,
      perKg: stepped(current.perKg[macro], delta),
    });
    if (result) setDraft(result);
    setBusy(false);
  }

  async function save() {
    setBusy(true);
    const result = await saveDiet({
      proteinPerKg: current.settings.proteinPerKg,
      fatPerKg: current.settings.fatPerKg,
      eggUnitGrams: Number(eggValue),
    });
    if (result) {
      setDraft(null);
      setEggText(null);
      setSavedMessage(true);
    }
    setBusy(false);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-neutral-900">Macronutrientes</h3>
          <ul className="mt-4 flex flex-col divide-y divide-neutral-100">
            {MACRO_ORDER.map((macro) => (
              <li key={macro} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: MACRO_COLORS[macro] }} />
                    <span className="font-medium text-neutral-900">{MACRO_NAMES[macro]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => step(macro, -STEP)}
                    disabled={busy || current.perKg[macro] <= current.minPerKg[macro]}
                    aria-label={`Diminuir ${MACRO_NAMES[macro].toLowerCase()}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25 disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="w-28 text-center">
                    <div className="font-semibold tabular-nums text-neutral-900">
                      {perKgFormat.format(current.perKg[macro])} g/kg
                    </div>
                    <div className="text-xs tabular-nums text-neutral-500">
                      {numberFormat.format(current.grams[macro])} g por dia
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => step(macro, STEP)}
                    disabled={busy || current.perKg[macro] >= current.maxPerKg[macro]}
                    aria-label={`Aumentar ${MACRO_NAMES[macro].toLowerCase()}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25 disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {usesEgg && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Egg size={20} />
                </span>
                <h3 className="min-w-0 font-semibold text-neutral-900">Peso da unidade do ovo</h3>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <span className="sr-only">Peso da unidade do ovo em gramas</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={30}
                  max={90}
                  step={1}
                  value={eggValue}
                  onChange={(event) => {
                    setSavedMessage(false);
                    setEggText(event.target.value);
                  }}
                  className="w-20 rounded-xl border border-neutral-200 px-3 py-2 text-right tabular-nums focus:border-accent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                g
              </label>
            </div>
          </section>
        )}
      </div>

      <aside className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
        <h3 className="font-semibold text-neutral-900">Calorias por macronutriente</h3>
        <div className="mt-4">
          <MacroPieChart split={current.split} names={MACRO_NAMES} />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy || !changed}
          className="mt-5 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          Salvar ajuste
        </button>
        {savedMessage && (
          <p role="status" className="mt-3 text-center text-sm text-neutral-500">
            Ajuste salvo. As porções do plano já seguem as novas metas.
          </p>
        )}
      </aside>
    </div>
  );
}
