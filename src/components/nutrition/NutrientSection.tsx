import type { Nutrient } from "@/lib/api/types";
import { NutrientTile } from "@/components/nutrition/NutrientTile";

type NutrientSectionProps = {
  title: string;
  description: string;
  /** Subgrupos com título (ex.: Vitaminas e Minerais); `title` vazio mostra só os cards. */
  groups: { title: string; nutrients: Nutrient[] }[];
};

export function NutrientSection({ title, description, groups }: NutrientSectionProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 text-xs text-neutral-500">{description}</p>

      {groups.map((group) => (
        <div key={group.title} className="mt-4">
          {group.title && <h4 className="mb-2 text-sm font-medium text-neutral-500">{group.title}</h4>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {group.nutrients.map((nutrient) => (
              <NutrientTile key={nutrient.id} {...nutrient} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
