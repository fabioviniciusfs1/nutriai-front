import { ProgressBar } from "@/components/dashboard/ProgressBar";

type Nutrient = {
  name: string;
  atual: number;
  meta: number;
  unit: string;
  color?: string;
};

type NutrientCardProps = {
  title: string;
  description: string;
  nutrients: Nutrient[];
};

export function NutrientCard({ title, description, nutrients }: NutrientCardProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 text-xs text-neutral-500">{description}</p>

      <div className="mt-4 flex flex-col gap-3">
        {nutrients.map((nutrient) => (
          <ProgressBar
            key={nutrient.name}
            label={nutrient.name}
            atual={nutrient.atual}
            meta={nutrient.meta}
            unit={nutrient.unit}
            color={nutrient.color}
          />
        ))}
      </div>
    </div>
  );
}
