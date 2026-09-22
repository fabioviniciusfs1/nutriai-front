const numberFormat = new Intl.NumberFormat("pt-BR");

type ProgressBarProps = {
  label: string;
  atual: number;
  meta: number;
  unit: string;
  color?: string;
};

export function ProgressBar({ label, atual, meta, unit, color = "var(--accent)" }: ProgressBarProps) {
  const percent = Math.min(100, Math.round((atual / meta) * 100));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-700">{label}</span>
        <span className="ml-auto text-neutral-400">
          {numberFormat.format(atual)}/{numberFormat.format(meta)}
          {unit}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={atual}
        aria-valuemin={0}
        aria-valuemax={meta}
        className="h-2 overflow-hidden rounded-full bg-neutral-100"
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
