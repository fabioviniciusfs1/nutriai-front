// Grupos do catálogo de alimentos. Os substitutos oferecidos ao marcar um alimento são do mesmo grupo.
export const FOOD_GROUPS = {
  carboidratos: "Carboidratos",
  proteinas: "Proteínas",
  laticinios: "Laticínios",
  gorduras: "Gorduras boas",
  frutas: "Frutas",
  vegetais: "Legumes e verduras",
  adocantes: "Adoçantes",
  acidos: "Temperos ácidos",
} as const;

export type FoodGroup = keyof typeof FOOD_GROUPS;
