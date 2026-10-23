"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveRoutine, useAuth } from "@/lib/auth";
import { personalizePlan } from "@/lib/api/actions";
import {
  DAY_PERIODS,
  DIETS,
  MEAL_SLOTS,
  WEEKDAYS,
  type MealSlot,
  type BusyTimes,
  type DayPeriod,
  type Routine,
  hoursOfWindows,
  unavailableHours,
  windowsOfHours,
} from "@/lib/profile";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { TimePickerDialog } from "@/components/dashboard/TimePickerDialog";
import { OptionCard } from "@/components/profile/OptionCard";

/** As 24 horas do dia; cada uma vale até a hora cheia seguinte. */
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const hourText = (hour: number) => `${String(hour % 24).padStart(2, "0")}:00`;

/** Horários de sono e treino do formulário; os de treino ficam guardados mesmo com "Não treino" marcado. */
type FormTimes = { wakeTime: string; sleepTime: string; trainingStart: string; trainingEnd: string };

/** O que tira horas da grade: o treino só conta para quem treina. */
const busyTimes = (times: FormTimes, trains: boolean | null): BusyTimes =>
  trains ? times : { ...times, trainingStart: null, trainingEnd: null };

/** Uma hora depois de "HH:MM" (o treino dura uma hora, até a pessoa dizer outra coisa). */
function oneHourLater(time: string) {
  return `${String((Number(time.slice(0, 2)) + 1) % 24).padStart(2, "0")}:${time.slice(3)}`;
}

/** Resposta às perguntas de fome: um período do dia ou "Não sinto". */
type HungerAnswer = DayPeriod | "nenhum";

const HUNGER_OPTIONS: { id: HungerAnswer; label: string }[] = [...DAY_PERIODS, { id: "nenhum", label: "Não sinto" }];

type Picking = { title: string; value: string; onConfirm: (value: string) => void };

function TimeButton({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: ${value}`}
      className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium tabular-nums text-neutral-900 transition-colors hover:border-neutral-300"
    >
      {value}
    </button>
  );
}

export function RoutineForm() {
  const auth = useAuth();
  const router = useRouter();
  const saved = auth?.routine;

  // `null` enquanto a pessoa não disse se treina.
  const [trains, setTrains] = useState<boolean | null>(saved ? saved.trainingStart !== null : null);
  const [times, setTimes] = useState<FormTimes>({
    wakeTime: saved?.wakeTime ?? "07:00",
    sleepTime: saved?.sleepTime ?? "23:00",
    trainingStart: saved?.trainingStart ?? "18:00",
    trainingEnd: saved?.trainingEnd ?? "19:00",
  });
  // Horas (0 a 23) em que a pessoa disse que não pode comer; as outras fora do sono e do treino ficam
  // disponíveis. No cadastro, nenhuma: todas vêm disponíveis.
  const [blocked, setBlocked] = useState<number[]>(() => {
    if (!saved) return [];
    const busy = unavailableHours(busyTimes(times, trains));
    const available = hoursOfWindows(saved.eatingWindows);
    return HOURS.filter((hour) => !busy.includes(hour) && !available.includes(hour));
  });
  const [meals, setMeals] = useState<MealSlot[]>(saved?.meals ?? []);
  // `null` = ainda sem resposta (só no cadastro); "nenhum" = "Não sinto", salvo como `null`.
  const [hungriest, setHungriest] = useState<HungerAnswer | null>(saved ? (saved.hungriestPeriod ?? "nenhum") : null);
  const [leastHungry, setLeastHungry] = useState<HungerAnswer | null>(
    saved ? (saved.leastHungryPeriod ?? "nenhum") : null
  );
  const [weighInDay, setWeighInDay] = useState<Routine["weighInDay"] | null>(saved?.weighInDay ?? null);
  const [diet, setDiet] = useState<Routine["diet"] | null>(saved?.diet ?? null);
  const [picking, setPicking] = useState<Picking | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [askingRebuild, setAskingRebuild] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const busyHours = unavailableHours(busyTimes(times, trains));
  const hours = HOURS.filter((hour) => !busyHours.includes(hour) && !blocked.includes(hour));
  const sameTraining = trains === true && times.trainingStart === times.trainingEnd;
  const samePeriod = hungriest !== null && hungriest !== "nenhum" && hungriest === leastHungry;

  const routine: Routine | null =
    hours.length > 0 &&
    trains !== null &&
    !sameTraining &&
    meals.length > 0 &&
    hungriest !== null &&
    leastHungry !== null &&
    !samePeriod &&
    weighInDay !== null &&
    diet !== null
      ? {
          eatingWindows: windowsOfHours(hours),
          ...busyTimes(times, trains),
          // Na ordem do dia, não na que foram marcadas.
          meals: MEAL_SLOTS.map((slot) => slot.id).filter((id) => meals.includes(id)),
          hungriestPeriod: hungriest === "nenhum" ? null : hungriest,
          leastHungryPeriod: leastHungry === "nenhum" ? null : leastHungry,
          weighInDay,
          diet,
        }
      : null;

  function pick(title: string, value: string, onConfirm: (value: string) => void) {
    setPicking({ title, value, onConfirm });
  }

  /** Muda sono ou treino; as horas que saem do sono ou do treino voltam disponíveis (se não foram bloqueadas). */
  function changeTimes(change: Partial<FormTimes>, nextTrains = trains) {
    const next = { ...times, ...change };
    setTimes(next);
    setTrains(nextTrains);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!routine) {
      setShowErrors(true);
      // No celular o botão fica no fim do formulário: leva o usuário até o primeiro campo com erro.
      const form = event.currentTarget;
      requestAnimationFrame(() => {
        form.querySelector("[data-invalid]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    // No cadastro, a pessoa confirma os dados antes de o plano ser montado.
    if (saved) await save(routine);
    else setConfirming(true);
  }

  async function save(data: Routine) {
    setSaving(true);
    const ok = await saveRoutine(data);
    setSaving(false);
    // Se falhar, o aviso de erro aparece e o usuário continua no formulário.
    if (!ok) return;
    // Na primeira vez o backend já começa a montar o plano; depois, só se o usuário pedir.
    if (saved) setAskingRebuild(true);
    else router.push("/");
  }

  async function rebuildPlan() {
    setAskingRebuild(false);
    if (await personalizePlan()) router.push("/");
  }

  const required = (missing: boolean) =>
    showErrors && missing && <p className="mt-1 text-xs text-red-600">Selecione uma opção</p>;

  // Os diálogos ficam fora do <form>: o seletor de horário tem um formulário próprio.
  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-neutral-900">Horários</h3>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-start gap-1.5">
                <span className="text-sm font-medium text-neutral-700">Acordo às</span>
                <TimeButton
                  label="Acordo às"
                  value={times.wakeTime}
                  onClick={() => pick("Hora em que você acorda", times.wakeTime, (wakeTime) => changeTimes({ wakeTime }))}
                />
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <span className="text-sm font-medium text-neutral-700">Durmo às</span>
                <TimeButton
                  label="Durmo às"
                  value={times.sleepTime}
                  onClick={() =>
                    pick("Hora em que você dorme", times.sleepTime, (sleepTime) => changeTimes({ sleepTime }))
                  }
                />
              </div>
            </div>

            <fieldset
              className="mt-4"
              data-invalid={showErrors && (trains === null || sameTraining) ? true : undefined}
            >
              <legend className="text-sm font-medium text-neutral-700">Treino</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <OptionCard
                  name="trains"
                  label="Treino"
                  checked={trains === true}
                  onChange={() => changeTimes({}, true)}
                />
                <OptionCard
                  name="trains"
                  label="Não treino"
                  checked={trains === false}
                  onChange={() => changeTimes({}, false)}
                />
              </div>
              {required(trains === null)}
              {trains && (
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="text-sm text-neutral-500">Começa às</span>
                    <TimeButton
                      label="Treino começa às"
                      value={times.trainingStart}
                      onClick={() =>
                        pick("Início do treino", times.trainingStart, (trainingStart) =>
                          changeTimes({ trainingStart, trainingEnd: oneHourLater(trainingStart) })
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="text-sm text-neutral-500">Termina às</span>
                    <TimeButton
                      label="Treino termina às"
                      value={times.trainingEnd}
                      onClick={() =>
                        pick("Fim do treino", times.trainingEnd, (trainingEnd) => changeTimes({ trainingEnd }))
                      }
                    />
                  </div>
                </div>
              )}
              {showErrors && sameTraining && (
                <p className="mt-1 text-xs text-red-600">O treino deve terminar depois de começar</p>
              )}
            </fieldset>

            <fieldset className="mt-4" data-invalid={showErrors && hours.length === 0 ? true : undefined}>
              <legend className="text-sm font-medium text-neutral-700">
                Toque nos horários em que você não pode comer
              </legend>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {HOURS.filter((hour) => !busyHours.includes(hour)).map((hour) => {
                  const checked = !blocked.includes(hour);
                  return (
                    <button
                      key={hour}
                      type="button"
                      aria-pressed={checked}
                      onClick={() =>
                        setBlocked((current) => (checked ? [...current, hour] : current.filter((item) => item !== hour)))
                      }
                      className={`rounded-xl border py-2 text-sm font-medium tabular-nums transition-colors ${
                        checked
                          ? "border-accent bg-accent/5 text-accent"
                          : "border-neutral-200 text-neutral-400 line-through hover:border-neutral-300"
                      }`}
                    >
                      {hourText(hour)}
                    </button>
                  );
                })}
              </div>
              {showErrors && hours.length === 0 && (
                <p className="mt-1 text-xs text-red-600">Deixe pelo menos um horário disponível</p>
              )}
            </fieldset>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-neutral-900">Refeições</h3>

            <fieldset className="mt-4" data-invalid={showErrors && meals.length === 0 ? true : undefined}>
              <legend className="text-sm font-medium text-neutral-700">Refeições por dia</legend>
              <p className="text-xs text-neutral-500">Marque as refeições que você faz no dia.</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MEAL_SLOTS.map((slot) => (
                  <OptionCard
                    key={slot.id}
                    type="checkbox"
                    name="meals"
                    label={slot.label}
                    checked={meals.includes(slot.id)}
                    onChange={() =>
                      setMeals((current) =>
                        current.includes(slot.id) ? current.filter((id) => id !== slot.id) : [...current, slot.id]
                      )
                    }
                  />
                ))}
              </div>
              {showErrors && meals.length === 0 && (
                <p className="mt-1 text-xs text-red-600">Marque pelo menos uma refeição</p>
              )}
            </fieldset>

            <fieldset className="mt-4" data-invalid={showErrors && hungriest === null ? true : undefined}>
              <legend className="text-sm font-medium text-neutral-700">Período em que sinto mais fome</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {HUNGER_OPTIONS.map((period) => (
                  <OptionCard
                    key={period.id}
                    name="hungriestPeriod"
                    label={period.label}
                    checked={hungriest === period.id}
                    onChange={() => setHungriest(period.id)}
                  />
                ))}
              </div>
              {required(hungriest === null)}
            </fieldset>

            <fieldset
              className="mt-4"
              data-invalid={showErrors && (leastHungry === null || samePeriod) ? true : undefined}
            >
              <legend className="text-sm font-medium text-neutral-700">Período em que sinto menos fome</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {HUNGER_OPTIONS.map((period) => (
                  <OptionCard
                    key={period.id}
                    name="leastHungryPeriod"
                    label={period.label}
                    checked={leastHungry === period.id}
                    onChange={() => setLeastHungry(period.id)}
                  />
                ))}
              </div>
              {required(leastHungry === null)}
              {showErrors && samePeriod && (
                <p className="mt-1 text-xs text-red-600">Escolha um período diferente do de mais fome</p>
              )}
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
              {required(weighInDay === null)}
            </fieldset>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-neutral-900">Preferências alimentares</h3>

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
              {required(diet === null)}
            </fieldset>
          </section>
        </div>

        <aside className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-6">
          <h3 className="font-semibold text-neutral-900">Seu plano</h3>
          <p className="mt-2 text-sm text-neutral-500">
            {saved
              ? "O plano atual continua como está. Depois de salvar, você escolhe se o assistente monta um novo com a rotina alterada."
              : "Com sua rotina, o assistente monta um plano alimentar feito para você: as refeições nos horários em que você pode comer, maiores quando você sente mais fome."}
          </p>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
          >
            {saved ? "Salvar alterações" : "Salvar e montar meu plano"}
          </button>
        </aside>
      </form>

      <TimePickerDialog
        open={picking !== null}
        title={picking?.title ?? ""}
        value={picking?.value ?? "00:00"}
        onConfirm={(value) => {
          picking?.onConfirm(value);
          setPicking(null);
        }}
        onCancel={() => setPicking(null)}
      />

      <ConfirmDialog
        open={confirming}
        title="As informações estão corretas?"
        description="Com elas o assistente monta seu plano alimentar. Você pode alterar depois em Rotina."
        confirmLabel="Confirmar"
        cancelLabel="Revisar"
        onConfirm={() => {
          setConfirming(false);
          if (routine) void save(routine);
        }}
        onCancel={() => setConfirming(false)}
      />

      <ConfirmDialog
        open={askingRebuild}
        title="Refazer seu plano?"
        description="A rotina foi salva. O assistente pode montar um plano novo com ela: as mudanças que você fez no plano atual são desfeitas (os alimentos marcados continuam)."
        confirmLabel="Refazer meu plano"
        cancelLabel="Agora não"
        onConfirm={() => void rebuildPlan()}
        onCancel={() => {
          setAskingRebuild(false);
          router.push("/");
        }}
      />
    </>
  );
}
