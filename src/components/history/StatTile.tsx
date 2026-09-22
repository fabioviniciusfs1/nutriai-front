type StatTileProps = {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
};

export function StatTile({ label, value, unit, hint }: StatTileProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-900">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-neutral-400">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
