"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pad, TimeFields, toTimeValue } from "@/components/dashboard/TimePickerDialog";

// Até quantos dias para trás dá para lançar uma pesagem esquecida (mesmo alcance do histórico).
const MAX_DAYS_BACK = 89;

type WeightDialogProps = {
  open: boolean;
  /** Último peso registrado, usado como sugestão no campo. */
  lastKg?: number;
  onConfirm: (kg: number, at: Date) => void;
  onCancel: () => void;
};

const dayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

function dayLabel(daysAgo: number, date: Date) {
  if (daysAgo === 0) return "Hoje";
  if (daysAgo === 1) return "Ontem";
  return dayFormat.format(date);
}

export function WeightDialog({ open, lastKg, onConfirm, onCancel }: WeightDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [kg, setKg] = useState("");
  const [daysAgo, setDaysAgo] = useState(0);
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");
  const [error, setError] = useState<string | null>(null);
  const [openedAt, setOpenedAt] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // Cada abertura começa no momento atual; o usuário ajusta se pesou em outro horário.
      const now = new Date();
      setKg("");
      setDaysAgo(0);
      setHours(pad(now.getHours()));
      setMinutes(pad(now.getMinutes()));
      setError(null);
      setOpenedAt(now.getTime());
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const day = new Date(openedAt);
  day.setDate(day.getDate() - daysAgo);

  function confirm(submittedAt: number) {
    const value = Number(kg.replace(",", "."));
    if (!kg.trim() || !Number.isFinite(value) || value < 20 || value > 400) {
      setError("Informe um peso entre 20 e 400 kg.");
      return;
    }

    const [h, m] = toTimeValue(hours, minutes).split(":").map(Number);
    const at = new Date(day);
    at.setHours(h, m, 0, 0);
    if (at.getTime() > submittedAt) {
      setError("O horário não pode estar no futuro.");
      return;
    }

    onConfirm(Math.round(value * 10) / 10, at);
  }

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
      className="m-auto w-[calc(100%-2rem)] max-w-xs rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <form
        className="p-5"
        onSubmit={(event) => {
          event.preventDefault();
          // Momento do envio (horário do evento), sem chamar Date.now() no corpo do componente.
          confirm(event.timeStamp + performance.timeOrigin);
        }}
      >
        <h4 className="font-semibold text-neutral-900">Registrar peso</h4>
        <p className="mt-1 text-xs text-neutral-500">Só para acompanhamento: não altera o peso do perfil nem a meta calórica.</p>

        <label className="mt-4 block text-sm font-medium text-neutral-700" htmlFor="weight-kg">
          Peso (kg)
        </label>
        <input
          id="weight-kg"
          autoFocus
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={lastKg ? String(lastKg).replace(".", ",") : "Ex.: 72,5"}
          value={kg}
          onChange={(event) => {
            setKg(event.target.value.replace(/[^\d.,]/g, ""));
            setError(null);
          }}
          className="mt-1 w-full rounded-xl bg-neutral-50 px-4 py-2.5 text-lg font-semibold text-neutral-900 outline-none focus:ring-2 focus:ring-accent"
        />

        <p className="mt-4 text-sm font-medium text-neutral-700">Data e horário</p>
        <div className="mt-1 flex items-center justify-between rounded-xl bg-neutral-50 px-1 py-1">
          <button
            type="button"
            aria-label="Dia anterior"
            disabled={daysAgo >= MAX_DAYS_BACK}
            onClick={() => {
              setDaysAgo((d) => d + 1);
              setError(null);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium capitalize text-neutral-800">{dayLabel(daysAgo, day)}</span>
          <button
            type="button"
            aria-label="Próximo dia"
            disabled={daysAgo === 0}
            onClick={() => {
              setDaysAgo((d) => d - 1);
              setError(null);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="mt-2">
          <TimeFields
            hours={hours}
            minutes={minutes}
            setHours={(value) => {
              setHours(value);
              setError(null);
            }}
            setMinutes={(value) => {
              setMinutes(value);
              setError(null);
            }}
          />
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
            Salvar
          </button>
        </div>
      </form>
    </dialog>
  );
}
