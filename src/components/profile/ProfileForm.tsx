"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, useAuth } from "@/lib/auth";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { Targets } from "@/lib/api/types";
import {
  ACTIVITY_LEVELS,
  DIETS,
  GOALS,
  MEALS_PER_DAY,
  SEXES,
  WEEKDAYS,
  type Profile,
} from "@/lib/profile";

const numberFormat = new Intl.NumberFormat("pt-BR");

const NUMERIC_FIELDS = [
  { key: "age", label: "Idade", unit: "anos", min: 14, max: 100, step: "1", inputMode: "numeric" },
  { key: "weightKg", label: "Peso", unit: "kg", min: 30, max: 300, step: "0.1", inputMode: "decimal" },
  { key: "heightCm", label: "Altura", unit: "cm", min: 120, max: 230, step: "1", inputMode: "numeric" },
] as const;

type NumericKey = (typeof NUMERIC_FIELDS)[number]["key"];

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return value.trim() === "" || Number.isNaN(parsed) ? null : parsed;
}

/**
 * Metas calculadas pelo backend para o perfil ainda não salvo, pedidas quando o usuário para de
 * digitar. `undefined` enquanto calcula.
 */
function useEstimate(profile: Profile | null) {
  const key = profile ? JSON.stringify(profile) : null;
  const [result, setResult] = useState<{ key: string; targets?: Targets; error?: string } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      apiFetch<Targets>("/profile/estimate", { method: "POST", body: JSON.parse(key) }).then(
        (targets) => !cancelled && setResult({ key, targets }),
        (error: unknown) =>
          !cancelled && setResult({ key, error: error instanceof ApiError ? error.message : "Erro inesperado." })
      );
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key]);

  return result?.key === key ? result : undefined;
}

function OptionCard({
  name,
  checked,
  label,
  description,
  onChange,
}: {
  name: string;
  checked: boolean;
  label: string;
  description?: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
        checked ? "border-accent bg-accent/5" : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-0.5 accent-accent" />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-neutral-900">{label}</span>
        {description && <span className="text-xs text-neutral-500">{description}</span>}
      </span>
    </label>
  );
}

export function ProfileForm() {
  const auth = useAuth();
  const router = useRouter();
  const saved = auth?.profile;

  const [sex, setSex] = useState<Profile["sex"] | null>(saved?.sex ?? null);
  const [numbers, setNumbers] = useState<Record<NumericKey, string>>({
    age: saved ? String(saved.age) : "",
    weightKg: saved ? String(saved.weightKg).replace(".", ",") : "",
    heightCm: saved ? String(saved.heightCm) : "",
  });
  const [activityLevel, setActivityLevel] = useState<Profile["activityLevel"] | null>(saved?.activityLevel ?? null);
  const [goal, setGoal] = useState<Profile["goal"] | null>(saved?.goal ?? null);
  const [mealsPerDay, setMealsPerDay] = useState<Profile["mealsPerDay"] | null>(saved?.mealsPerDay ?? null);
  const [weighInDay, setWeighInDay] = useState<Profile["weighInDay"] | null>(saved?.weighInDay ?? null);
  const [diet, setDiet] = useState<Profile["diet"] | null>(saved?.diet ?? null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const numberErrors = Object.fromEntries(
    NUMERIC_FIELDS.map((field) => {
      const value = parseNumber(numbers[field.key]);
      const error =
        value === null
          ? "Campo obrigatório"
          : value < field.min || value > field.max
            ? `Entre ${field.min} e ${field.max} ${field.unit}`
            : null;
      return [field.key, error];
    })
  ) as Record<NumericKey, string | null>;

  const profile: Profile | null =
    sex &&
    activityLevel &&
    goal &&
    mealsPerDay !== null &&
    weighInDay !== null &&
    diet !== null &&
    Object.values(numberErrors).every((error) => error === null)
      ? {
          sex,
          age: parseNumber(numbers.age)!,
          weightKg: parseNumber(numbers.weightKg)!,
          heightCm: parseNumber(numbers.heightCm)!,
          activityLevel,
          goal,
          mealsPerDay,
          weighInDay,
          diet,
        }
      : null;

  const estimateResult = useEstimate(profile);
  const estimate = estimateResult?.targets;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      setShowErrors(true);
      // No celular o botão fica no fim do formulário: leva o usuário até o primeiro campo com erro.
      const form = event.currentTarget;
      requestAnimationFrame(() => {
        form.querySelector("[data-invalid]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setSaving(true);
    const ok = await saveProfile(profile);
    setSaving(false);
    // Se falhar, o aviso de erro aparece e o usuário continua no formulário.
    if (ok) router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-neutral-900">Dados corporais</h3>

          <fieldset className="mt-4" data-invalid={showErrors && !sex ? true : undefined}>
            <legend className="text-sm font-medium text-neutral-700">Sexo biológico</legend>
            <p className="text-xs text-neutral-500">Usado na fórmula de gasto energético.</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SEXES.map((item) => (
                <OptionCard
                  key={item.id}
                  name="sex"
                  label={item.label}
                  checked={sex === item.id}
                  onChange={() => setSex(item.id)}
                />
              ))}
            </div>
            {showErrors && !sex && <p className="mt-1 text-xs text-red-600">Selecione uma opção</p>}
          </fieldset>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {NUMERIC_FIELDS.map((field) => {
              const error = showErrors ? numberErrors[field.key] : null;
              return (
                <label
                  key={field.key}
                  data-invalid={error ? true : undefined}
                  className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700"
                >
                  {field.label}
                  <span className="relative">
                    <input
                      type="number"
                      inputMode={field.inputMode}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={numbers[field.key]}
                      onChange={(event) => setNumbers((current) => ({ ...current, [field.key]: event.target.value }))}
                      aria-invalid={error ? true : undefined}
                      className={`w-full rounded-xl border bg-white px-3 py-2.5 pr-14 text-sm text-neutral-900 outline-none transition-colors focus:ring-2 ${
                        error
                          ? "border-red-400 focus:ring-red-100"
                          : "border-neutral-200 focus:border-accent focus:ring-accent/20"
                      }`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-neutral-400">
                      {field.unit}
                    </span>
                  </span>
                  {error && <span className="text-xs font-normal text-red-600">{error}</span>}
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <fieldset data-invalid={showErrors && !activityLevel ? true : undefined}>
            <legend className="font-semibold text-neutral-900">Frequência de atividade física</legend>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ACTIVITY_LEVELS.map((level) => (
                <OptionCard
                  key={level.id}
                  name="activityLevel"
                  label={level.label}
                  description={level.description}
                  checked={activityLevel === level.id}
                  onChange={() => setActivityLevel(level.id)}
                />
              ))}
            </div>
            {showErrors && !activityLevel && <p className="mt-1 text-xs text-red-600">Selecione uma opção</p>}
          </fieldset>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <fieldset data-invalid={showErrors && !goal ? true : undefined}>
            <legend className="font-semibold text-neutral-900">Objetivo</legend>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {GOALS.map((item) => (
                <OptionCard
                  key={item.id}
                  name="goal"
                  label={item.label}
                  description={item.description}
                  checked={goal === item.id}
                  onChange={() => setGoal(item.id)}
                />
              ))}
            </div>
            {showErrors && !goal && <p className="mt-1 text-xs text-red-600">Selecione uma opção</p>}
          </fieldset>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-neutral-900">Rotina</h3>

          <fieldset className="mt-4" data-invalid={showErrors && mealsPerDay === null ? true : undefined}>
            <legend className="text-sm font-medium text-neutral-700">Refeições por dia</legend>
            <p className="text-xs text-neutral-500">Quantas refeições você consegue fazer no dia.</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MEALS_PER_DAY.map((count) => (
                <OptionCard
                  key={count}
                  name="mealsPerDay"
                  label={`${count} refeições`}
                  checked={mealsPerDay === count}
                  onChange={() => setMealsPerDay(count)}
                />
              ))}
            </div>
            {showErrors && mealsPerDay === null && <p className="mt-1 text-xs text-red-600">Selecione uma opção</p>}
          </fieldset>

          <fieldset className="mt-4" data-invalid={showErrors && weighInDay === null ? true : undefined}>
            <legend className="text-sm font-medium text-neutral-700">Lembrete de pesagem</legend>
            <p className="text-xs text-neutral-500">Dia da semana em que o app vai lembrar você de registrar o peso.</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {WEEKDAYS.map((day) => (
                <OptionCard
                  key={day.id}
                  name="weighInDay"
                  label={day.label}
                  checked={weighInDay === day.id}
                  onChange={() => setWeighInDay(day.id)}
                />
              ))}
            </div>
            {showErrors && weighInDay === null && <p className="mt-1 text-xs text-red-600">Selecione uma opção</p>}
          </fieldset>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-neutral-900">Preferências alimentares</h3>
          {!saved && (
            <p className="mt-1 text-xs text-neutral-500">
              Com essas informações, o assistente monta um plano alimentar feito para você.
            </p>
          )}

          <fieldset className="mt-4" data-invalid={showErrors && diet === null ? true : undefined}>
            <legend className="text-sm font-medium text-neutral-700">Tipo de alimentação</legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DIETS.map((item) => (
                <OptionCard
                  key={item.id}
                  name="diet"
                  label={item.label}
                  description={item.description}
                  checked={diet === item.id}
                  onChange={() => setDiet(item.id)}
                />
              ))}
            </div>
            {showErrors && diet === null && <p className="mt-1 text-xs text-red-600">Selecione uma opção</p>}
          </fieldset>
        </section>
      </div>

      <aside className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-6">
        <h3 className="font-semibold text-neutral-900">Sua meta diária</h3>

        {estimate && profile ? (
          <>
            <p className="mt-4 text-4xl font-semibold text-neutral-900">
              {numberFormat.format(estimate.calories)}
              <span className="ml-1 text-base font-medium text-neutral-400">kcal</span>
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {GOALS.find((item) => item.id === profile.goal)!.label}
            </p>

            <dl className="mt-5 flex flex-col gap-3 border-t border-neutral-100 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Taxa metabólica basal</dt>
                <dd className="font-medium text-neutral-900">{numberFormat.format(estimate.bmr)} kcal</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Gasto diário estimado</dt>
                <dd className="font-medium text-neutral-900">{numberFormat.format(estimate.tdee)} kcal</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Água</dt>
                <dd className="font-medium text-neutral-900">
                  {numberFormat.format(estimate.waterLiters)} L
                </dd>
              </div>
            </dl>

            {estimate.clampedToMinimum && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                A meta foi ajustada para o mínimo recomendado. Para déficits maiores, procure um nutricionista.
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">
            {!profile
              ? "Preencha seus dados para calcular quantas calorias seu plano alimentar deve ter."
              : estimateResult?.error
                ? `Não foi possível calcular a meta: ${estimateResult.error}`
                : "Calculando…"}
          </p>
        )}

        <p className="mt-4 text-xs text-neutral-400">
          Estimativa calculada a partir dos seus dados. Não substitui a orientação de um profissional.
        </p>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          {saved ? "Salvar alterações" : "Salvar e continuar"}
        </button>
      </aside>
    </form>
  );
}
