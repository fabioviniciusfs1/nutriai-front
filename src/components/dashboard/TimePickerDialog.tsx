"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Seletor próprio em vez do <input type="time">: no Android o seletor nativo é desenhado
// pelo sistema e corta o texto dos botões ("Defin…") conforme a fonte do aparelho.
// Hora e minutos podem ser ajustados pelas setas ou digitados direto.

const MINUTE_STEP = 5;

type TimePickerDialogProps = {
  open: boolean;
  title: string;
  /** "HH:MM" */
  value: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Converte o texto digitado em número dentro de 0..max (vazio vira 0). */
function clamp(text: string, max: number) {
  return Math.min(Number(text) || 0, max);
}

function Stepper({
  label,
  value,
  max,
  inputRef,
  onChange,
  onFilled,
  onUp,
  onDown,
}: {
  label: string;
  value: string;
  max: number;
  inputRef?: React.Ref<HTMLInputElement>;
  onChange: (value: string) => void;
  /** Chamado quando o usuário termina de digitar os dois dígitos. */
  onFilled?: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onUp}
        aria-label={`Aumentar ${label}`}
        className="flex h-11 w-16 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100"
      >
        <ChevronUp size={22} />
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        aria-label={label}
        value={value}
        onFocus={(event) => {
          // No celular o toque posiciona o cursor depois do focus e desfaz a seleção; seleciona em seguida.
          const input = event.currentTarget;
          setTimeout(() => input.select());
        }}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onChange(digits);
          if (digits.length === 2) onFilled?.();
        }}
        // Lê o valor do próprio campo: o blur disparado pelo pulo automático para os minutos
        // acontece antes do re-render, e `value` ainda teria só o primeiro dígito ("2" → "02").
        onBlur={(event) => onChange(pad(clamp(event.currentTarget.value, max)))}
        className="w-16 rounded-xl bg-neutral-50 py-1 text-center text-4xl font-semibold tabular-nums text-neutral-900 outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="button"
        onClick={onDown}
        aria-label={`Diminuir ${label}`}
        className="flex h-11 w-16 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100"
      >
        <ChevronDown size={22} />
      </button>
    </div>
  );
}

/** Normaliza o que foi digitado/ajustado nos campos para "HH:MM". */
export function toTimeValue(hours: string, minutes: string) {
  return `${pad(clamp(hours, 23))}:${pad(clamp(minutes, 59))}`;
}

/** Campos de hora e minuto (setas ▲/▼ ou digitação), reaproveitados fora deste diálogo. */
export function TimeFields({
  hours,
  minutes,
  setHours,
  setMinutes,
}: {
  hours: string;
  minutes: string;
  setHours: React.Dispatch<React.SetStateAction<string>>;
  setMinutes: React.Dispatch<React.SetStateAction<string>>;
}) {
  const minutesRef = useRef<HTMLInputElement>(null);

  function stepMinutes(direction: 1 | -1) {
    setMinutes((text) => {
      const current = clamp(text, 59);
      const next =
        direction === 1
          ? Math.floor(current / MINUTE_STEP) * MINUTE_STEP + MINUTE_STEP
          : Math.ceil(current / MINUTE_STEP) * MINUTE_STEP - MINUTE_STEP;
      return pad((next + 60) % 60);
    });
  }

  function stepHours(direction: 1 | -1) {
    setHours((text) => pad((clamp(text, 23) + direction + 24) % 24));
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Stepper
        label="hora"
        value={hours}
        max={23}
        onChange={setHours}
        onFilled={() => minutesRef.current?.focus()}
        onUp={() => stepHours(1)}
        onDown={() => stepHours(-1)}
      />
      <span className="pb-1 text-4xl font-semibold text-neutral-400">:</span>
      <Stepper
        label="minutos"
        value={minutes}
        max={59}
        inputRef={minutesRef}
        onChange={setMinutes}
        onUp={() => stepMinutes(1)}
        onDown={() => stepMinutes(-1)}
      />
    </div>
  );
}

export function TimePickerDialog({ open, title, value, onConfirm, onCancel }: TimePickerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const [h = "00", m = "00"] = value.split(":");
      setHours(h);
      setMinutes(m);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, value]);

  function confirm() {
    onConfirm(toTimeValue(hours, minutes));
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
          confirm();
        }}
      >
        <h4 className="font-semibold text-neutral-900">{title}</h4>

        <div className="mt-4">
          <TimeFields hours={hours} minutes={minutes} setHours={setHours} setMinutes={setMinutes} />
        </div>

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
            autoFocus
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Definir
          </button>
        </div>
      </form>
    </dialog>
  );
}
