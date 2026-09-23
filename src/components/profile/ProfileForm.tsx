"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, useAuth } from "@/lib/auth";
import {
  ACTIVITY_LEVELS,
  GOALS,
  SEXES,
  calculateCalorieTarget,
  calculateWaterLiters,
  type Profile,
} from "@/lib/calorie-target";

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
  const [showErrors, setShowErrors] = useState(false);

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
    sex && activityLevel && goal && Object.values(numberErrors).every((error) => error === null)
      ? {
          sex,
          age: parseNumber(numbers.age)!,
          weightKg: parseNumber(numbers.weightKg)!,
          heightCm: parseNumber(numbers.heightCm)!,
          activityLevel,
          goal,
        }
      : null;

  const estimate = profile ? calculateCalorieTarget(profile) : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    saveProfile(profile);
    router.push("/");
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
      </div>

      <aside className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-6">
        <h3 className="font-semibold text-neutral-900">Sua meta diária</h3>

        {estimate && profile ? (
          <>
            <p className="mt-4 text-4xl font-semibold text-neutral-900">
              {numberFormat.format(estimate.target)}
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
                  {numberFormat.format(calculateWaterLiters(profile.weightKg))} L
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
            Preencha seus dados para calcular quantas calorias seu plano alimentar deve ter.
          </p>
        )}

        <p className="mt-4 text-xs text-neutral-400">
          Estimativa pela equação de Mifflin-St Jeor. Não substitui a orientação de um profissional.
        </p>

        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          {saved ? "Salvar alterações" : "Salvar e continuar"}
        </button>
      </aside>
    </form>
  );
}
