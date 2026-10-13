/** Opção em forma de card dos formulários de perfil e de rotina: escolha única (rádio) ou de marcar (`checkbox`). */
export function OptionCard({
  type = "radio",
  name,
  checked,
  label,
  description,
  onChange,
}: {
  type?: "radio" | "checkbox";
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
      <input type={type} name={name} checked={checked} onChange={onChange} className="mt-0.5 accent-accent" />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-neutral-900">{label}</span>
        {description && <span className="text-xs text-neutral-500">{description}</span>}
      </span>
    </label>
  );
}
