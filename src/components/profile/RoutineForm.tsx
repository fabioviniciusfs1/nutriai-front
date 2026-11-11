"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { saveRoutine, useAuth } from "@/lib/auth";
import { AVOID_PATH, personalizePlan, saveAvoidRules } from "@/lib/api/actions";
import { useApiQuery } from "@/lib/api/query";
import type { AvoidRule } from "@/lib/api/types";
import {
  DIETS,
  MAIN_MEAL_SLOTS,
  MEAL_SLOTS,
  WEEKDAYS,
  type MealSlot,
  type BusyTimes,
  type Routine,
  type RoutineSchedule,
  type Weekday,
  hoursOfWindows,
  unavailableHours,
  windowsOfHours,
} from "@/lib/profile";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { TimePickerDialog } from "@/components/dashboard/TimePickerDialog";
import { OptionCard } from "@/components/profile/OptionCard";
import { AvoidFoods } from "@/components/foods/AvoidFoods";
import { daysLabel } from "@/lib/plan-selection";

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

/** Os lanches entre as refeições principais: os únicos que a pessoa escolhe. */
const SNACK_SLOTS = MEAL_SLOTS.filter((slot) => !MAIN_MEAL_SLOTS.includes(slot.id));

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

/** Um grupo de dias da semana no formulário, com a rotina dele. */
type Group = {
  /** Chave da lista (os grupos novos ainda não têm `id`). */
  key: number;
  /** Número do grupo salvo (e do plano dele); sem ele, é um grupo novo. */
  id?: number;
  days: Weekday[];
  // `null` enquanto a pessoa não disse se treina.
  trains: boolean | null;
  times: FormTimes;
  // Horas (0 a 23) em que a pessoa disse que pode comer; as do sono e do treino não contam. No cadastro,
  // nenhuma: a pessoa marca as dela.
  allowed: number[];
  // Só os lanches marcados; as refeições principais entram sempre.
  snacks: MealSlot[];
};

const ALL_DAYS: Weekday[] = WEEKDAYS.map((day) => day.id);

let nextKey = 0;

function groupOf(schedule: RoutineSchedule): Group {
  return {
    key: nextKey++,
    id: schedule.id,
    days: schedule.days,
    trains: schedule.trainingStart !== null,
    times: {
      wakeTime: schedule.wakeTime,
      sleepTime: schedule.sleepTime,
      trainingStart: schedule.trainingStart ?? "18:00",
      trainingEnd: schedule.trainingEnd ?? "19:00",
    },
    allowed: hoursOfWindows(schedule.eatingWindows),
    snacks: schedule.meals.filter((slot) => !MAIN_MEAL_SLOTS.includes(slot)),
  };
}

const EMPTY_GROUP: Omit<Group, "key"> = {
  days: ALL_DAYS,
  trains: null,
  times: { wakeTime: "07:00", sleepTime: "23:00", trainingStart: "18:00", trainingEnd: "19:00" },
  allowed: [],
  snacks: [],
};

/** Horas livres e marcadas do grupo, e se ele está completo. */
function groupStatus(group: Group) {
  const busyHours = unavailableHours(busyTimes(group.times, group.trains));
  const hours = HOURS.filter((hour) => !busyHours.includes(hour) && group.allowed.includes(hour));
  const sameTraining = group.trains === true && group.times.trainingStart === group.times.trainingEnd;
  const valid = group.days.length > 0 && group.trains !== null && !sameTraining && hours.length > 0;
  return { busyHours, hours, sameTraining, valid };
}

function scheduleOf(group: Group): RoutineSchedule {
  return {
    ...(group.id !== undefined ? { id: group.id } : {}),
    days: group.days,
    eatingWindows: windowsOfHours(groupStatus(group).hours),
    ...busyTimes(group.times, group.trains),
    // Na ordem do dia, não na que foram marcadas.
    meals: MEAL_SLOTS.map((slot) => slot.id).filter((id) => MAIN_MEAL_SLOTS.includes(id) || group.snacks.includes(id)),
  };
}

export function RoutineForm() {
  const auth = useAuth();
  const router = useRouter();
  const saved = auth?.routine;

  const [groups, setGroups] = useState<Group[]>(() =>
    saved ? saved.schedules.map(groupOf) : [{ ...EMPTY_GROUP, key: nextKey++ }]
  );
  const [weighInDay, setWeighInDay] = useState<Routine["weighInDay"] | null>(saved?.weighInDay ?? null);
  const [diet, setDiet] = useState<Routine["diet"] | null>(saved?.diet ?? null);
  // "Alimentos que você não come": as salvas (depois do cadastro) até a pessoa mudar; `null` = sem mudança.
  const savedAvoid = useApiQuery<AvoidRule[]>(saved ? AVOID_PATH : null);
  const [avoid, setAvoid] = useState<AvoidRule[] | null>(null);
  const avoidRules = avoid ?? savedAvoid.data ?? [];
  const [picking, setPicking] = useState<Picking | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [askingRebuild, setAskingRebuild] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const missingDays = WEEKDAYS.filter((day) => !groups.some((group) => group.days.includes(day.id)));

  const routine: Routine | null =
    groups.every((group) => groupStatus(group).valid) &&
    missingDays.length === 0 &&
    weighInDay !== null &&
    diet !== null
      ? { schedules: groups.map(scheduleOf), weighInDay, diet }
      : null;

  function pick(title: string, value: string, onConfirm: (value: string) => void) {
    setPicking({ title, value, onConfirm });
  }

  function changeGroup(key: number, change: (group: Group) => Partial<Group>) {
    setGroups((current) => current.map((group) => (group.key === key ? { ...group, ...change(group) } : group)));
  }

  /** Marcar um dia num grupo tira ele do outro; desmarcar deixa o dia sem grupo (até a pessoa escolher outro). */
  function toggleDay(key: number, day: Weekday) {
    setGroups((current) => {
      const owner = current.find((group) => group.key === key);
      const has = owner?.days.includes(day);
      return current.map((group) =>
        group.key === key
          ? { ...group, days: has ? group.days.filter((item) => item !== day) : [...group.days, day] }
          : has
            ? group
            : { ...group, days: group.days.filter((item) => item !== day) }
      );
    });
  }

  /** Outro grupo, começando com a rotina do primeiro e sem dias (a pessoa escolhe quais). */
  function addGroup() {
    setGroups((current) => [...current, { ...current[0], key: nextKey++, id: undefined, days: [] }]);
  }

  /** Os dias do grupo removido voltam para o primeiro dos outros. */
  function removeGroup(key: number) {
    setGroups((current) => {
      const removed = current.find((group) => group.key === key);
      const rest = current.filter((group) => group.key !== key);
      return rest.map((group, index) =>
        index === 0 ? { ...group, days: [...group.days, ...(removed?.days ?? [])] } : group
      );
    });
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
    // Antes da rotina: no cadastro, o assistente monta o primeiro plano já sem esses alimentos.
    if (avoid !== null && !(await saveAvoidRules(avoid))) {
      setSaving(false);
      return;
    }
    setAvoid(null);
    const ok = await saveRoutine(data);
    setSaving(false);
    // Se falhar, o aviso de erro aparece e o usuário continua no formulário.
    if (!ok) return;
    // Na primeira vez o backend já começa a montar os planos (e depois, os dos grupos novos); os outros, só se o
    // usuário pedir.
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
          {groups.map((group) => (
            <GroupCard
              key={group.key}
              group={group}
              split={groups.length > 1}
              showErrors={showErrors}
              pick={pick}
              onChange={(change) => changeGroup(group.key, change)}
              onToggleDay={(day) => toggleDay(group.key, day)}
              onRemove={() => removeGroup(group.key)}
            />
          ))}

          {groups.length < WEEKDAYS.length && (
            <button
              type="button"
              onClick={addGroup}
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-4 text-sm font-medium text-neutral-700 transition-colors hover:border-accent hover:text-accent"
            >
              <Plus size={16} /> Meus horários mudam em alguns dias
            </button>
          )}
          {showErrors && missingDays.length > 0 && (
            <p data-invalid className="-mt-2 text-xs text-red-600">
              Escolha um grupo para: {missingDays.map((day) => day.label).join(", ")}
            </p>
          )}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-neutral-900">Preferências</h3>

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

            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-neutral-700">Alimentos que você não come (opcional)</legend>
              <p className="mb-2 text-xs text-neutral-500">
                Pesquise e escolha o tipo: o assistente não usa esses alimentos no seu plano nem nas sugestões.
              </p>
              <AvoidFoods rules={avoidRules} onChange={setAvoid} />
            </fieldset>
          </section>
        </div>

        <aside className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-6">
          <h3 className="font-semibold text-neutral-900">Seu plano</h3>
          <p className="mt-2 text-sm text-neutral-500">
            {saved
              ? "Os planos atuais continuam como estão. Depois de salvar, você escolhe se o assistente monta novos com a rotina alterada (um grupo de dias novo ganha o plano dele na hora)."
              : "Com sua rotina, o assistente monta um plano alimentar feito para você: as refeições nos horários em que você pode comer, com as calorias divididas ao longo do dia. Com horários diferentes em alguns dias, cada grupo de dias ganha o próprio plano."}
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
        title={groups.length > 1 ? "Refazer seus planos?" : "Refazer seu plano?"}
        description="A rotina foi salva. O assistente pode montar planos novos com ela: as mudanças que você fez nos planos atuais são desfeitas (os alimentos marcados continuam)."
        confirmLabel={groups.length > 1 ? "Refazer meus planos" : "Refazer meu plano"}
        cancelLabel="Agora não"
        highlightCancel
        onConfirm={() => void rebuildPlan()}
        onCancel={() => {
          setAskingRebuild(false);
          router.push("/");
        }}
      />
    </>
  );
}

/** A rotina de um grupo de dias: os dias (com mais de um grupo), sono, treino, horários para comer e lanches. */
function GroupCard({
  group,
  split,
  showErrors,
  pick,
  onChange,
  onToggleDay,
  onRemove,
}: {
  group: Group;
  split: boolean;
  showErrors: boolean;
  pick: (title: string, value: string, onConfirm: (value: string) => void) => void;
  onChange: (change: (group: Group) => Partial<Group>) => void;
  onToggleDay: (day: Weekday) => void;
  onRemove: () => void;
}) {
  const { busyHours, hours, sameTraining } = groupStatus(group);
  const { times, trains } = group;

  /** Muda sono ou treino; as horas que saem do sono ou do treino voltam marcadas só se a pessoa já as tinha marcado. */
  function changeTimes(change: Partial<FormTimes>, nextTrains = trains) {
    onChange((current) => ({ times: { ...current.times, ...change }, trains: nextTrains }));
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-neutral-900">
          {split ? `Horários: ${group.days.length > 0 ? daysLabel(group.days) : "escolha os dias"}` : "Horários"}
        </h3>
        {split && (
          <button
            type="button"
            title="Remover este grupo de dias"
            aria-label="Remover este grupo de dias"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {split && (
        <fieldset className="mt-4" data-invalid={showErrors && group.days.length === 0 ? true : undefined}>
          <legend className="text-sm font-medium text-neutral-700">Dias</legend>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {WEEKDAYS.map((day) => {
              const checked = group.days.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => onToggleDay(day.id)}
                  className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                    checked
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                  }`}
                >
                  {day.label.slice(0, 3)}
                </button>
              );
            })}
          </div>
          {showErrors && group.days.length === 0 && (
            <p className="mt-1 text-xs text-red-600">Escolha pelo menos um dia</p>
          )}
        </fieldset>
      )}

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
            onClick={() => pick("Hora em que você dorme", times.sleepTime, (sleepTime) => changeTimes({ sleepTime }))}
          />
        </div>
      </div>

      <fieldset className="mt-4" data-invalid={showErrors && (trains === null || sameTraining) ? true : undefined}>
        <legend className="text-sm font-medium text-neutral-700">Treino</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <OptionCard
            name={`trains-${group.key}`}
            label="Treino"
            checked={trains === true}
            onChange={() => changeTimes({}, true)}
          />
          <OptionCard
            name={`trains-${group.key}`}
            label="Não treino"
            checked={trains === false}
            onChange={() => changeTimes({}, false)}
          />
        </div>
        {showErrors && trains === null && <p className="mt-1 text-xs text-red-600">Selecione uma opção</p>}
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
                onClick={() => pick("Fim do treino", times.trainingEnd, (trainingEnd) => changeTimes({ trainingEnd }))}
              />
            </div>
          </div>
        )}
        {showErrors && sameTraining && (
          <p className="mt-1 text-xs text-red-600">O treino deve terminar depois de começar</p>
        )}
      </fieldset>

      <fieldset className="mt-4" data-invalid={showErrors && hours.length === 0 ? true : undefined}>
        <legend className="text-sm font-medium text-neutral-700">Toque nos horários em que você pode comer</legend>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {HOURS.filter((hour) => !busyHours.includes(hour)).map((hour) => {
            const checked = group.allowed.includes(hour);
            return (
              <button
                key={hour}
                type="button"
                aria-pressed={checked}
                onClick={() =>
                  onChange((current) => ({
                    allowed: checked ? current.allowed.filter((item) => item !== hour) : [...current.allowed, hour],
                  }))
                }
                className={`rounded-xl border py-2 text-sm font-medium tabular-nums transition-colors ${
                  checked
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                }`}
              >
                {hourText(hour)}
              </button>
            );
          })}
        </div>
        {showErrors && hours.length === 0 && <p className="mt-1 text-xs text-red-600">Marque pelo menos um horário</p>}
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-neutral-700">Lanches</legend>
        <p className="text-xs text-neutral-500">
          {split ? "Nesses dias, o plano" : "Seu plano"} tem café da manhã, almoço e janta. Marque os lanches que você
          faz entre eles.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SNACK_SLOTS.map((slot) => (
            <OptionCard
              key={slot.id}
              type="checkbox"
              name={`meals-${group.key}`}
              label={slot.label}
              checked={group.snacks.includes(slot.id)}
              onChange={() =>
                onChange((current) => ({
                  snacks: current.snacks.includes(slot.id)
                    ? current.snacks.filter((id) => id !== slot.id)
                    : [...current.snacks, slot.id],
                }))
              }
            />
          ))}
        </div>
      </fieldset>
    </section>
  );
}
