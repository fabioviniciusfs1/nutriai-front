import type { Nutrient } from "@/lib/mock-data";

const numberFormat = new Intl.NumberFormat("pt-BR");

/** Card de um nutriente: consumo de hoje em relação à meta (ou ao limite, se `limit`). */
export function NutrientTile({ name, atual, meta, unit, limit }: Nutrient) {
  const percent = Math.round((atual / meta) * 100);
  const overLimit = limit && atual > meta;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-neutral-700">{name}</span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
            overLimit ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {percent}%
        </span>
      </div>
      <p className="text-2xl font-semibold text-neutral-900 tabular-nums">
        {numberFormat.format(atual)}
        <span className="ml-1 text-sm font-medium text-neutral-400">{unit}</span>
      </p>
      <div
        role="progressbar"
        aria-label={name}
        aria-valuenow={atual}
        aria-valuemin={0}
        aria-valuemax={meta}
        className="h-2 overflow-hidden rounded-full bg-neutral-100"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, percent)}%`,
            backgroundColor: overLimit ? "#dc2626" : "var(--accent)",
          }}
        />
      </div>
      <p className={`text-xs ${overLimit ? "text-red-600" : "text-neutral-500"}`}>
        {limit ? "Limite" : "Meta"}: {numberFormat.format(meta)} {unit}
        {overLimit && " · acima do limite"}
      </p>
    </div>
  );
}
