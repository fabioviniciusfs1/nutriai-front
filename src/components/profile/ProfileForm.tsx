"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, saveTargetWeight, useAuth } from "@/lib/auth";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { Targets, WeightProjection } from "@/lib/api/types";
import { ACTIVITY_LEVELS, GOALS, SEXES, type Profile } from "@/lib/profile";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { OptionCard } from "@/components/profile/OptionCard";
import { WeightProjectionChart } from "@/components/profile/WeightProjectionChart";

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
 * Conta feita pelo backend para o formulário ainda não salvo (`POST` em `path`), pedida quando o usuário
 * para de digitar. `undefined` enquanto calcula.
 */
function useCalculation<T>(path: string, body: object | null) {
  const key = body ? JSON.stringify(body) : null;
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      apiFetch<T>(path, { method: "POST", body: JSON.parse(key) }).then(
        (data) => !cancelled && setResult({ key, data }),
        (error: unknown) =>
          !cancelled && setResult({ key, error: error instanceof ApiError ? error.message : "Erro inesperado." })
      );
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [path, key]);

  return result?.key === key ? result : undefined;
}

export function ProfileForm() {
  const auth = useAuth();
  const router = useRouter();
  const saved = auth?.profile;
  // O perfil é informado no cadastro (até a rotina ser salva); depois fica só para leitura.
  const readOnly = !!auth?.routine;

  const [sex, setSex] = useState<Profile["sex"] | null>(saved?.sex ?? null);
  const [numbers, setNumbers] = useState<Record<NumericKey, string>>({
    age: saved ? String(saved.age) : "",
    // O valor de um campo numérico sempre usa ponto (o navegador exibe conforme o idioma); com vírgula ele fica vazio.
    weightKg: saved ? String(saved.weightKg) : "",
    heightCm: saved ? String(saved.heightCm) : "",
  });
  const [activityLevel, setActivityLevel] = useState<Profile["activityLevel"] | null>(saved?.activityLevel ?? null);
  const [goal, setGoal] = useState<Profile["goal"] | null>(saved?.goal ?? null);
  // O peso meta é o único dado do perfil que muda depois do cadastro.
  const [targetWeight, setTargetWeight] = useState(saved?.targetWeightKg != null ? String(saved.targetWeightKg) : "");
  const [savingTarget, setSavingTarget] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

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

  // O peso meta é o único dado que pode mudar depois do cadastro. Obrigatório para perder ou ganhar; com manter, não há.
  const needsTargetWeight = goal !== "manter";
  const targetWeightKg = needsTargetWeight ? parseNumber(targetWeight) : null;
  const targetWeightError = !needsTargetWeight
    ? null
    : targetWeightKg === null
      ? "Campo obrigatório"
      : targetWeightKg < 30 || targetWeightKg > 300
        ? "Entre 30 e 300 kg"
        : null;
  const chosenTargetWeight = targetWeightError ? null : targetWeightKg;
  // O erro de campo vazio só aparece depois de tentar continuar (como nos outros campos).
  const shownTargetWeightError = showErrors || targetWeightKg !== null ? targetWeightError : null;

  // Dados que a meta diária usa (o peso meta não muda as metas: fica de fora para não recalcular a cada tecla).
  const bodyProfile: Profile | null =
    sex &&
    activityLevel &&
    goal &&
    Object.values(numberErrors).every((error) => error === null)
      ? {
          sex,
          age: parseNumber(numbers.age)!,
          weightKg: parseNumber(numbers.weightKg)!,
          heightCm: parseNumber(numbers.heightCm)!,
          activityLevel,
          goal,
          targetWeightKg: null,
        }
      : null;
  // Perfil completo, pronto para salvar.
  const profile: Profile | null =
    bodyProfile && !targetWeightError ? { ...bodyProfile, targetWeightKg: chosenTargetWeight } : null;

  const estimateResult = useCalculation<Targets>("/profile/estimate", bodyProfile);
  const estimate = estimateResult?.data;

  const projectionResult = useCalculation<WeightProjection>(
    "/profile/projection",
    profile?.targetWeightKg != null ? profile : null
  );
  const targetWeightChanged = readOnly && chosenTargetWeight !== (saved?.targetWeightKg ?? null);

  async function updateTargetWeight() {
    setSavingTarget(true);
    // Se falhar, o aviso de erro aparece e o valor continua no campo.
    await saveTargetWeight(chosenTargetWeight);
    setSavingTarget(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    if (!profile) {
      setShowErrors(true);
      // No celular o botão fica no fim do formulário: leva o usuário até o primeiro campo com erro.
      const form = event.currentTarget;
      requestAnimationFrame(() => {
        form.querySelector("[data-invalid]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    // A pessoa confirma os dados antes de seguir: eles não mudam depois.
    setConfirming(true);
  }

  async function save(data: Profile) {
    setSaving(true);
    const ok = await saveProfile(data);
    setSaving(false);
    // Se falhar, o aviso de erro aparece e o usuário continua no formulário.
    // O próximo passo do cadastro é a rotina.
    if (ok) router.push("/rotina");
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        {/* `disabled` no fieldset desativa todos os campos de uma vez. */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-4">
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
                          onChange={(event) =>
                            setNumbers((current) => ({ ...current, [field.key]: event.target.value }))
                          }
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
          </fieldset>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-neutral-900">Peso meta</h3>
            <p className="text-xs text-neutral-500">Veja em quanto tempo, aproximadamente, você chega lá.</p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label
                data-invalid={shownTargetWeightError ? true : undefined}
                className="flex w-48 flex-col gap-1.5 text-sm font-medium text-neutral-700"
              >
                Peso meta
                <span className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={30}
                    max={300}
                    step="0.1"
                    value={needsTargetWeight ? targetWeight : ""}
                    onChange={(event) => setTargetWeight(event.target.value)}
                    disabled={!needsTargetWeight}
                    aria-invalid={shownTargetWeightError ? true : undefined}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 pr-14 text-sm text-neutral-900 outline-none transition-colors focus:ring-2 disabled:bg-neutral-50 ${
                      shownTargetWeightError
                        ? "border-red-400 focus:ring-red-100"
                        : "border-neutral-200 focus:border-accent focus:ring-accent/20"
                    }`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-neutral-400">
                    kg
                  </span>
                </span>
                {shownTargetWeightError && (
                  <span className="text-xs font-normal text-red-600">{shownTargetWeightError}</span>
                )}
              </label>
              {readOnly && (
                <button
                  type="button"
                  onClick={() => void updateTargetWeight()}
                  disabled={!targetWeightChanged || !!targetWeightError || savingTarget}
                  className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
                >
                  Salvar peso meta
                </button>
              )}
            </div>

            {!needsTargetWeight && (
              <p className="mt-4 text-sm text-neutral-500">Com o objetivo de manter o peso, não há peso meta.</p>
            )}
            {profile?.targetWeightKg != null &&
              (projectionResult?.data ? (
                <WeightProjectionChart projection={projectionResult.data} />
              ) : (
                <p className="mt-4 text-sm text-neutral-500">{projectionResult?.error ?? "Calculando…"}</p>
              ))}
            {!bodyProfile && chosenTargetWeight !== null && (
              <p className="mt-4 text-sm text-neutral-500">Preencha seus dados para ver a estimativa.</p>
            )}
          </section>
        </div>

        <aside className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-6">
          <h3 className="font-semibold text-neutral-900">Sua meta diária</h3>

          {estimate && bodyProfile ? (
            <>
              <p className="mt-4 text-4xl font-semibold text-neutral-900">
                {numberFormat.format(estimate.calories)}
                <span className="ml-1 text-base font-medium text-neutral-400">kcal</span>
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {GOALS.find((item) => item.id === bodyProfile.goal)!.label}
              </p>

              <dl className="mt-5 flex flex-col gap-3 border-t border-neutral-200 pt-4 text-sm">
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
              {!bodyProfile
                ? "Preencha seus dados para calcular quantas calorias seu plano alimentar deve ter."
                : estimateResult?.error
                  ? `Não foi possível calcular a meta: ${estimateResult.error}`
                  : "Calculando…"}
            </p>
          )}

          <p className="mt-4 text-xs text-neutral-400">
            Estimativa calculada a partir dos seus dados. Não substitui a orientação de um profissional.
          </p>

          {readOnly ? (
            <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
              Estes dados foram informados no cadastro e não podem ser alterados.
            </p>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
            >
              Continuar
            </button>
          )}
        </aside>
      </form>

      <ConfirmDialog
        open={confirming}
        title="As informações estão corretas?"
        description="Confira seus dados antes de continuar."
        confirmLabel="Confirmar"
        cancelLabel="Revisar"
        onConfirm={() => {
          setConfirming(false);
          if (profile) void save(profile);
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
