"use client";

import { useEffect, useRef, useState } from "react";
import { pad, TimeFields, toTimeValue } from "@/components/dashboard/TimePickerDialog";

const MAX_NAME_LENGTH = 40;

const numberFormat = new Intl.NumberFormat("pt-BR");

/** O que acontece no dia se a refeição for criada — mostrado no aviso antes de confirmar. */
export type CreateMealPreview = {
  totals: { carbs: number; protein: number; fat: number; kcal: number };
  /** Quanto as porções das outras refeições diminuem (%). */
  reductionPercent: number;
  sources: { title: string; time: string; before: number; after: number }[];
};

type CreateMealDialogProps = {
  open: boolean;
  preview: (name: string, time: string) => CreateMealPreview;
  onConfirm: (name: string, time: string) => void;
  onCancel: () => void;
};

export function CreateMealDialog({ open, preview, onConfirm, onCancel }: CreateMealDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");
  const [error, setError] = useState<string | null>(null);
  // Segunda etapa: o aviso de onde saem os nutrientes da nova refeição.
  const [confirming, setConfirming] = useState<CreateMealPreview | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // Começa no horário atual; o usuário ajusta para quando vai fazer a refeição.
      const now = new Date();
      setName("");
      setHours(pad(now.getHours()));
      setMinutes(pad(now.getMinutes()));
      setError(null);
      setConfirming(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const time = toTimeValue(hours, minutes);
  const dayKcal = confirming?.sources.reduce((sum, source) => sum + source.before, 0) ?? 0;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      {confirming ? (
        <div className="p-5">
          <h4 className="font-semibold text-neutral-900">Criar &ldquo;{name.trim()}&rdquo;?</h4>
          <p className="mt-2 text-sm text-neutral-600">
            O assistente vai sugerir uma refeição de <strong>{numberFormat.format(confirming.totals.kcal)} kcal</strong>{" "}
            para as {time} ({confirming.totals.carbs}g carb. · {confirming.totals.protein}g prot. ·{" "}
            {confirming.totals.fat}g gord.).
          </p>

          {confirming.sources.length > 0 ? (
            <>
              <p className="mt-3 text-sm text-neutral-600">
                Para não passar da meta diária, esses nutrientes saem das outras refeições, que terão as porções
                reduzidas em <strong>{confirming.reductionPercent}%</strong>:
              </p>
              <ul className="mt-3 flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-100">
                {confirming.sources.map((source) => (
                  <li key={`${source.time}-${source.title}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="w-11 shrink-0 text-xs text-neutral-400">{source.time}</span>
                    <span className="min-w-0 flex-1 truncate text-neutral-800">{source.title}</span>
                    <span className="shrink-0 text-right tabular-nums text-neutral-500">
                      {source.before} → <span className="font-medium text-neutral-900">{source.after}</span> kcal
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-neutral-500">
                O total do dia continua em cerca de {numberFormat.format(dayKcal)} kcal.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-neutral-600">Não há outras refeições hoje para ajustar.</p>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="mr-auto rounded-full px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => onConfirm(name.trim(), time)}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              Confirmar
            </button>
          </div>
        </div>
      ) : (
        <form
          className="p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError("Dê um nome para a refeição.");
              return;
            }
            setConfirming(preview(name.trim(), time));
          }}
        >
          <h4 className="font-semibold text-neutral-900">Nova refeição</h4>
          <p className="mt-1 text-xs text-neutral-500">
            O assistente sugere os alimentos e tira os nutrientes das outras refeições, sem passar da meta diária.
          </p>

          <label className="mt-4 block text-sm font-medium text-neutral-700" htmlFor="meal-name">
            Nome
          </label>
          <input
            id="meal-name"
            type="text"
            autoComplete="off"
            maxLength={MAX_NAME_LENGTH}
            placeholder="Ex.: Lanche pré-treino"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            className="mt-1 w-full rounded-xl bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-accent"
          />

          <p className="mt-4 text-sm font-medium text-neutral-700">Horário</p>
          <div className="mt-1">
            <TimeFields hours={hours} minutes={minutes} setHours={setHours} setMinutes={setMinutes} />
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              Continuar
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
